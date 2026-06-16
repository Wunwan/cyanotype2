import { motion, useMotionValue } from 'framer-motion';
import { useRef, type RefObject } from 'react';
import type { Print, PrintPosition } from '../lib/storage';

/**
 * A scattered, draggable print in the gallery. Position is held in motion
 * values (initialised from storage) and committed back on drag end. A small
 * "moved" guard keeps a drag from also firing the open-on-tap.
 */
export default function MemoryThumb({
  print,
  constraintsRef,
  onOpen,
  onCommit,
}: {
  print: Print;
  constraintsRef: RefObject<HTMLDivElement | null>;
  onOpen: (id: string) => void;
  onCommit: (id: string, pos: PrintPosition) => void;
}) {
  const pos = print.position ?? { x: 0, y: 0, rotation: 0 };
  const x = useMotionValue(pos.x);
  const y = useMotionValue(pos.y);
  const moved = useRef(false);

  return (
    <motion.button
      type="button"
      aria-label={`Open ${print.metadata.name || 'print'}`}
      className="absolute left-0 top-0 w-[116px] cursor-grab touch-none active:cursor-grabbing"
      style={{ x, y, rotate: pos.rotation }}
      drag
      dragConstraints={constraintsRef}
      dragMomentum={false}
      dragElastic={0.06}
      whileDrag={{ scale: 1.05, zIndex: 30 }}
      whileTap={{ scale: 1.03 }}
      onDragStart={() => {
        moved.current = false;
      }}
      onDrag={() => {
        moved.current = true;
      }}
      onDragEnd={() =>
        onCommit(print.id, { x: x.get(), y: y.get(), rotation: pos.rotation })
      }
      onClick={() => {
        if (!moved.current) onOpen(print.id);
        moved.current = false;
      }}
    >
      <div className="bg-bone p-1.5 shadow-[1px_1px_6px_rgba(0,0,0,0.18)]">
        <img
          src={print.finalImage}
          alt=""
          draggable={false}
          className="block aspect-[4/5] w-full object-cover"
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
