import type { ReactNode } from 'react';

/** Target viewport — iPhone 17 logical size. */
export const SCREEN_W = 402;
export const SCREEN_H = 874;

/**
 * Scales the 402×874 app to fill the viewport (no device bezel), so it sits
 * edge-to-edge on a phone. The 402×874 aspect ratio is preserved — Figma
 * coordinates stay exact — and any tiny remainder blends into the cream
 * backdrop. On a wide desktop it simply centers as a tall phone-shaped column.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-full w-full place-items-center overflow-hidden bg-cream">
      <div
        className="relative"
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          // Fill the viewport (scale up or down) while keeping the aspect ratio.
          ['--scale' as string]: 'min(calc(100vw / 402), calc(100vh / 874))',
          transform: 'scale(var(--scale))',
          transformOrigin: 'center center',
        }}
      >
        <div className="absolute inset-0 overflow-hidden bg-cream">{children}</div>
      </div>
    </div>
  );
}
