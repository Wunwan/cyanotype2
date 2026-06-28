import { motion, useMotionValue } from 'framer-motion';
import { useRef, useState, type RefObject } from 'react';
import type { Print, PrintPosition } from '../lib/storage';

const THUMB_W = 116;
const THUMB_H = 150;

/**
 * A scattered, draggable print in the gallery.
 *
 * Drag is handled manually (not Framer's `drag`) because the app renders inside
 * a CSS `transform: scale()` phone frame on desktop, which breaks Framer's
 * pointer→element mapping (drag feels stiff and lags the cursor). We measure the
 * live scale from the element's rendered width and divide pointer deltas by it,
 * so the thumb tracks the cursor 1:1 at any frame scale. A small move threshold
 * distinguishes a drag from a tap (which opens the print).
 */
export default function MemoryThumb({
  print,
  containerRef,
  z,
  onInteract,
  onOpen,
  onCommit,
}: {
  print: Print;
  containerRef: RefObject<HTMLDivElement | null>;
  /** Persistent stacking order — the last-touched print sits on top. */
  z: number;
  onInteract: () => void;
  onOpen: (id: string) => void;
  onCommit: (id: string, pos: PrintPosition) => void;
}) {
  const pos = print.position ?? { x: 0, y: 0, rotation: 0 };
  const x = useMotionValue(pos.x);
  const y = useMotionValue(pos.y);
  const ref = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(false);
  const gesture = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    scale: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    const scale = rect && rect.width ? rect.width / THUMB_W : 1;
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: x.get(),
      baseY: y.get(),
      scale,
      moved: false,
    };
    ref.current?.setPointerCapture(e.pointerId);
    setActive(true);
    onInteract(); // bring to the front, and keep it there
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = (e.clientX - g.startX) / g.scale;
    const dy = (e.clientY - g.startY) / g.scale;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) g.moved = true;
    const cont = containerRef.current;
    const maxX = (cont?.clientWidth ?? 402) - THUMB_W;
    const maxY = (cont?.clientHeight ?? 700) - THUMB_H;
    x.set(Math.max(0, Math.min(maxX, g.baseX + dx)));
    y.set(Math.max(0, Math.min(maxY, g.baseY + dy)));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    ref.current?.releasePointerCapture(e.pointerId);
    setActive(false);
    gesture.current = null;
    if (g.moved) onCommit(print.id, { x: x.get(), y: y.get(), rotation: pos.rotation });
    else onOpen(print.id);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={`Open ${print.metadata.name || 'print'}`}
      className="absolute left-0 top-0 w-[116px] touch-none select-none"
      style={{
        x,
        y,
        rotate: pos.rotation,
        zIndex: active ? 1000 : z,
        scale: active ? 1.05 : 1,
        cursor: active ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="bg-white p-1.5 shadow-[1px_1px_6px_rgba(0,0,0,0.18)]">
        <img
          src={print.finalImage}
          alt=""
          draggable={false}
          className="block aspect-[4/5] w-full object-cover bg-white"
        />
        {print.metadata.name && (
          <div className="truncate pt-1 text-center text-[10px] text-ink">
            {print.metadata.name}
          </div>
        )}
      </div>
    </motion.button>
  );
}
