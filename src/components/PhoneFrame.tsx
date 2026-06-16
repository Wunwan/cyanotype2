import type { ReactNode } from 'react';

/** Target viewport — iPhone 17 logical size. */
export const SCREEN_W = 402;
export const SCREEN_H = 874;

/**
 * On desktop, render the app inside a centered phone-shaped frame on a neutral
 * backdrop. The frame scales down to fit smaller viewports while preserving the
 * 402×874 aspect ratio, so screen coordinates from Figma stay exact.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-full w-full place-items-center overflow-hidden">
      <div
        className="relative"
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          // Fit-to-viewport scale, never upscaling past 1.
          ['--scale' as string]:
            'min(1, calc((100vw - 16px) / 402), calc((100vh - 16px) / 874))',
          transform: 'scale(var(--scale))',
          transformOrigin: 'center center',
        }}
      >
        {/* Device bezel */}
        <div className="absolute -inset-[12px] rounded-[56px] bg-neutral-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/5" />
        {/* Screen */}
        <div className="absolute inset-0 overflow-hidden rounded-[40px] bg-cream">
          {children}
        </div>
      </div>
    </div>
  );
}
