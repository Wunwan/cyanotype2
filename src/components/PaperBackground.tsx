import type { ReactNode } from 'react';

/**
 * Full-bleed warm-cream paper surface with a faint tiled noise grain.
 * Used as the base layer of every paper screen (1-5, 8-10).
 */
export default function PaperBackground({
  children,
  className = '',
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`paper-bg h-full w-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
