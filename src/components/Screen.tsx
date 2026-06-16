import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Wraps each screen so route changes cross-fade with a slight slide instead of
 * hard-cutting. Spring physics, never linear. Used together with the
 * <AnimatePresence> in App.
 */
const variants = {
  initial: { opacity: 0, x: 18 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};

export default function Screen({
  children,
  scrollable = false,
}: {
  children: ReactNode;
  /** Screen 8 scrolls vertically; all others lock to the viewport. */
  scrollable?: boolean;
}) {
  return (
    <motion.div
      className={`absolute inset-0 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
