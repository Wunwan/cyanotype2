import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

export type BrushType = 'brush' | 'bristle' | 'sponge';

export interface PaintCanvasHandle {
  toBlob: () => Promise<Blob | null>;
  fill: () => void;
}

interface Props {
  width: number;
  height: number;
  className?: string;
  /** Fired (throttled) with painted coverage 0..1. */
  onCoverage?: (pct: number) => void;
  brushType?: BrushType;
  /** Base brush radius in px. Default 18. */
  brushSize?: number;
}

const STROKE_RGB = '#1a4d80';
const STROKE_ALPHA = 0.6;

/**
 * Finger/mouse paint surface with three brush modes.
 * - brush: smooth round strokes (original behaviour, size-aware)
 * - bristle: multiple thin parallel strands spread perpendicular to travel
 * - sponge: scattered dot stipple around the pointer
 *
 * In-progress stroke is drawn opaquely on an "active" layer, then baked onto
 * the committed canvas at 0.6 alpha on stroke end (avoids beading artefacts).
 */
const PaintCanvas = forwardRef<PaintCanvasHandle, Props>(function PaintCanvas(
  { width, height, className, onCoverage, brushType = 'brush', brushSize = 18 },
  ref,
) {
  const mainRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const lastMid = useRef<{ x: number; y: number } | null>(null);
  const lineW = useRef(brushSize * 2);
  const sampleCanvas = useRef<HTMLCanvasElement | null>(null);
  const movesSinceSample = useRef(0);
  // Keep refs so drawing callbacks always see the latest prop values.
  const brushTypeRef = useRef(brushType);
  const brushSizeRef = useRef(brushSize);
  useEffect(() => { brushTypeRef.current = brushType; }, [brushType]);
  useEffect(() => { brushSizeRef.current = brushSize; lineW.current = brushSize * 2; }, [brushSize]);

  useImperativeHandle(ref, () => ({
    toBlob: () =>
      new Promise((resolve) => {
        const c = mainRef.current;
        if (!c) return resolve(null);
        c.toBlob((b) => resolve(b), 'image/png');
      }),
    fill: () => {
      const main = mainRef.current;
      if (!main) return;
      const ctx = main.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = STROKE_ALPHA;
      ctx.fillStyle = STROKE_RGB;
      ctx.fillRect(0, 0, main.width, main.height);
      ctx.restore();
      onCoverage?.(1);
    },
  }));

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [mainRef.current, activeRef.current]) {
      if (!c) continue;
      c.width = width * dpr;
      c.height = height * dpr;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = STROKE_RGB;
        ctx.fillStyle = STROKE_RGB;
      }
    }
  }, [width, height]);

  const sampleCoverage = useCallback(() => {
    if (!onCoverage) return;
    const main = mainRef.current;
    const active = activeRef.current;
    if (!main) return;
    if (!sampleCanvas.current) {
      const s = document.createElement('canvas');
      s.width = 88;
      s.height = Math.round((88 * height) / width);
      sampleCanvas.current = s;
    }
    const s = sampleCanvas.current;
    const sctx = s.getContext('2d');
    if (!sctx) return;
    sctx.clearRect(0, 0, s.width, s.height);
    sctx.globalAlpha = 1;
    sctx.drawImage(main, 0, 0, s.width, s.height);
    if (active && drawing.current) {
      sctx.globalAlpha = STROKE_ALPHA;
      sctx.drawImage(active, 0, 0, s.width, s.height);
    }
    const { data } = sctx.getImageData(0, 0, s.width, s.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 10) painted++;
    onCoverage(painted / (s.width * s.height));
  }, [height, width, onCoverage]);

  const pointFromEvent = (e: React.PointerEvent) => {
    const rect = activeRef.current!.getBoundingClientRect();
    // rect is in screen pixels; divide by the CSS-to-logical ratio to undo any
    // parent CSS scale() transform (e.g. PhoneFrame's viewport scaling).
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    return { x: (e.clientX - rect.left) / scaleX, y: (e.clientY - rect.top) / scaleY };
  };

  const drawDot = (ctx: CanvasRenderingContext2D, p: { x: number; y: number }) => {
    const r = lineW.current / 2;
    if (brushTypeRef.current === 'sponge') {
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * r;
        ctx.globalAlpha = 0.3 + Math.random() * 0.7;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, 1 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (brushTypeRef.current === 'brush') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // bristle: no initial dot — direction is unknown on pointer-down so the
    // first move segment handles the starting mark naturally.
  };

  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    prev: { x: number; y: number },
    prevMid: { x: number; y: number },
    mid: { x: number; y: number },
    p: { x: number; y: number },
  ) => {
    const type = brushTypeRef.current;
    const base = brushSizeRef.current;

    if (type === 'bristle') {
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = -dy / len;
      const perpY = dx / len;
      const n: number = 6;
      const halfSpread = lineW.current * 0.55;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
        const off = t * halfSpread;
        ctx.lineWidth = 1.5 + Math.random() * 2;
        ctx.globalAlpha = 0.45 + Math.random() * 0.55;
        ctx.beginPath();
        ctx.moveTo(prevMid.x + perpX * off, prevMid.y + perpY * off);
        ctx.quadraticCurveTo(prev.x + perpX * off, prev.y + perpY * off, mid.x + perpX * off, mid.y + perpY * off);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (type === 'sponge') {
      const r = lineW.current / 2;
      const count = Math.max(8, Math.round(r * 0.9));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * r;
        ctx.globalAlpha = 0.25 + Math.random() * 0.6;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, 1 + Math.random() * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // Round brush with gentle width drift.
      lineW.current = Math.max(base * 1.6, Math.min(base * 2.5, lineW.current + (Math.random() - 0.5) * 3));
      ctx.lineWidth = lineW.current;
      ctx.beginPath();
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
      ctx.stroke();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const ctx = activeRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = pointFromEvent(e);
    lastPoint.current = p;
    lastMid.current = p;
    activeRef.current?.setPointerCapture(e.pointerId);
    lineW.current = brushSizeRef.current * 2;
    drawDot(ctx, p);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = activeRef.current?.getContext('2d');
    const prev = lastPoint.current;
    const prevMid = lastMid.current;
    if (!ctx || !prev || !prevMid) return;
    const p = pointFromEvent(e);
    const mid = { x: (prev.x + p.x) / 2, y: (prev.y + p.y) / 2 };
    ctx.lineWidth = lineW.current;
    drawSegment(ctx, prev, prevMid, mid, p);
    lastPoint.current = p;
    lastMid.current = mid;

    if (++movesSinceSample.current >= 12) {
      movesSinceSample.current = 0;
      sampleCoverage();
    }
  };

  const endStroke = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    lastMid.current = null;

    const main = mainRef.current;
    const active = activeRef.current;
    if (main && active) {
      const m = main.getContext('2d');
      const a = active.getContext('2d');
      if (m && a) {
        m.save();
        m.setTransform(1, 0, 0, 1, 0, 0);
        m.globalAlpha = STROKE_ALPHA;
        m.drawImage(active, 0, 0);
        m.restore();
        a.save();
        a.setTransform(1, 0, 0, 1, 0, 0);
        a.clearRect(0, 0, active.width, active.height);
        a.restore();
      }
    }
    sampleCoverage();
  };

  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <canvas ref={mainRef} className="absolute inset-0" style={{ width, height }} />
      <canvas
        ref={activeRef}
        className="absolute inset-0"
        style={{ width, height, opacity: STROKE_ALPHA, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
    </div>
  );
});

export default PaintCanvas;
