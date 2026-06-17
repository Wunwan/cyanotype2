import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

export interface PaintCanvasHandle {
  toBlob: () => Promise<Blob | null>;
}

interface Props {
  width: number;
  height: number;
  className?: string;
  /** Fired (throttled) with painted coverage 0..1. */
  onCoverage?: (pct: number) => void;
}

const STROKE_RGB = '#1a4d80'; // drawn opaque, then baked at 0.6 → rgba(26,77,128,0.6)
const STROKE_ALPHA = 0.6;

/**
 * Finger/mouse paint surface. To get a smooth, *connected*, semi-transparent
 * stroke we draw the in-progress stroke OPAQUELY on a top "active" layer using
 * continuous mid-point quadratic smoothing (no gaps, no beading), then bake it
 * onto the committed canvas at 0.6 alpha when the stroke ends. Coverage is
 * sampled (downscaled) so the caller can enable "done" past ~15%.
 */
const PaintCanvas = forwardRef<PaintCanvasHandle, Props>(function PaintCanvas(
  { width, height, className, onCoverage },
  ref,
) {
  const mainRef = useRef<HTMLCanvasElement>(null); // committed strokes (baked @0.6)
  const activeRef = useRef<HTMLCanvasElement>(null); // current stroke (opaque)
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const lastMid = useRef<{ x: number; y: number } | null>(null);
  const lineW = useRef(36);
  const sampleCanvas = useRef<HTMLCanvasElement | null>(null);
  const movesSinceSample = useRef(0);

  useImperativeHandle(ref, () => ({
    toBlob: () =>
      new Promise((resolve) => {
        const c = mainRef.current;
        if (!c) return resolve(null);
        c.toBlob((b) => resolve(b), 'image/png');
      }),
  }));

  // Size both layers at device resolution.
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
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const ctx = activeRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = pointFromEvent(e);
    lastPoint.current = p;
    lastMid.current = p;
    activeRef.current?.setPointerCapture(e.pointerId);
    // A dot so a tap/click leaves a mark.
    ctx.beginPath();
    ctx.arc(p.x, p.y, lineW.current / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = activeRef.current?.getContext('2d');
    const prev = lastPoint.current;
    const prevMid = lastMid.current;
    if (!ctx || !prev || !prevMid) return;
    const p = pointFromEvent(e);
    const mid = { x: (prev.x + p.x) / 2, y: (prev.y + p.y) / 2 };
    // Gentle width drift for a brushy, hand-coated edge (no abrupt jumps).
    lineW.current = Math.max(30, Math.min(44, lineW.current + (Math.random() - 0.5) * 3));
    ctx.lineWidth = lineW.current;
    // Continuous curve: previous midpoint → new midpoint, control = the real point.
    ctx.beginPath();
    ctx.moveTo(prevMid.x, prevMid.y);
    ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
    ctx.stroke();
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
      // Bake the opaque stroke onto the committed canvas at 0.6 alpha.
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
