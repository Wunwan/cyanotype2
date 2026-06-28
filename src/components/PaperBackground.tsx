import type { ReactNode } from 'react';

export default function PaperBackground({
  children,
  className = '',
  bgColor,
}: {
  children?: ReactNode;
  className?: string;
  bgColor?: string;
}) {
  return (
    <div
      className={`paper-bg h-full w-full overflow-hidden ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {/* Paper texture — z:0, always below screen content. */}
      <img
        src="/assets/paper.png"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 0 }}
      />
      {/* Content wrapper — z:1 ensures all children paint above the paper. */}
      <div className="relative z-[1] h-full w-full">
        {children}
      </div>
    </div>
  );
}
