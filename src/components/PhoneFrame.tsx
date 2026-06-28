import { type ReactNode, useEffect, useRef } from 'react';

/** Target viewport — iPhone 17 logical size. */
export const SCREEN_W = 402;
export const SCREEN_H = 874;

/**
 * Scales the 402×874 app to fill the visible viewport exactly.
 * Uses window.innerHeight (via visualViewport when available) instead of CSS
 * dvh units, which are inconsistent across Android/iOS browsers. Updates on
 * every resize so the scale stays correct when the address bar shows/hides.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const scale = Math.min(vw / SCREEN_W, vh / SCREEN_H);

      if (outerRef.current) outerRef.current.style.height = `${vh}px`;
      if (innerRef.current) innerRef.current.style.transform = `scale(${scale})`;
    };

    update();
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className="grid w-full place-items-center overflow-hidden bg-cream"
      style={{ height: '100dvh' }}
    >
      <div
        ref={innerRef}
        className="relative"
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          transformOrigin: 'center center',
        }}
      >
        <div className="absolute inset-0 overflow-hidden bg-cream">{children}</div>
      </div>
    </div>
  );
}
