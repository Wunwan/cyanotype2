import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const tap = { scale: 0.96 };
const spring = { type: 'spring', stiffness: 400, damping: 24 } as const;

/**
 * Prussian-blue outlined pill button. Min 44px tall tap target with a subtle
 * spring press state. Used for "done" / "next" / "Memory lane" etc.
 */
export function PillButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  'aria-label'?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={disabled ? undefined : tap}
      transition={spring}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-edge px-5 py-2.5 text-center text-[16px] leading-none text-ink transition-opacity disabled:opacity-40 ${className}`}
    >
      {children}
    </motion.button>
  );
}

/**
 * Plain underline-less text link with the same press feel — for secondary
 * actions like "I know how to make it" / "Make another".
 */
export function TextLink({
  children,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={tap}
      transition={spring}
      className={`inline-flex min-h-[44px] items-center justify-center text-center text-[14px] text-ink ${className}`}
    >
      {children}
    </motion.button>
  );
}
