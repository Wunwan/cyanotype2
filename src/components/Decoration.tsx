import { motion } from 'framer-motion';

export interface DecorationProps {
  src: string;
  /** Absolute box in 402×874 screen coordinates (from Figma). */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Resting rotation in degrees. */
  rotate?: number;
  /** Where it flies in from (offset from resting position). */
  from?: { x?: number; y?: number; rotate?: number };
  /** Entrance delay (s) — used to stagger decorations one at a time. */
  delay?: number;
  /** Idle loop style once settled. */
  idle?: 'rotate' | 'float' | 'none';
  /** Idle amplitude (deg for rotate, px for float). */
  idleAmount?: number;
  /** Idle loop duration (s) — keep in the 4-6s range. */
  idleDuration?: number;
  zIndex?: number;
}

/**
 * A PNG decoration that springs in from off-position, then drifts with a gentle,
 * non-linear idle loop so the screen feels alive. Entrance and idle live on
 * separate nested layers so their transforms compose instead of fighting.
 */
export default function Decoration({
  src,
  left,
  top,
  width,
  height,
  rotate = 0,
  from = { y: -120 },
  delay = 0,
  idle = 'rotate',
  idleAmount = 2,
  idleDuration = 5,
  zIndex = 10,
}: DecorationProps) {
  const idleAnim =
    idle === 'rotate'
      ? { rotate: [-idleAmount, idleAmount, -idleAmount] }
      : idle === 'float'
        ? { y: [-idleAmount, idleAmount, -idleAmount] }
        : {};

  return (
    <motion.div
      aria-hidden
      className="absolute"
      style={{ left, top, width, height, zIndex }}
      initial={{
        opacity: 0,
        x: from.x ?? 0,
        y: from.y ?? 0,
        rotate: rotate + (from.rotate ?? 0),
        scale: 0.85,
      }}
      animate={{ opacity: 1, x: 0, y: 0, rotate, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
    >
      {/* Inner layer: idle drift, started after the entrance settles. */}
      <motion.div
        className="h-full w-full"
        animate={idleAnim}
        transition={{
          duration: idleDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 0.7,
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-contain"
        />
      </motion.div>
    </motion.div>
  );
}
