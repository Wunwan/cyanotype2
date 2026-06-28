import { type ReactNode, useEffect, useRef } from 'react';

/** Target viewport — iPhone 17 logical size. */
export const SCREEN_W = 402;
export const SCREEN_H = 874;

/**
 * Scales the 402×874 app to fit the visible viewport and centers it.
 *
 * Why JS instead of CSS grid + dvh:
 *   grid place-items-center centers the LAYOUT box (402×874), not the visual
 *   (scaled) box. When the phone is shorter than 874px the layout box overflows
 *   the container, pushing the visual content off-center. Using explicit
 *   absolute positioning based on window.visualViewport avoids this entirely.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      // Use innerWidth/innerHeight (layout viewport) — stable when keyboard appears.
      // visualViewport shrinks for the keyboard; innerHeight does not (especially
      // with interactive-widget=resizes-visual in the viewport meta tag).
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / SCREEN_W, vh / SCREEN_H);

      if (outerRef.current) {
        outerRef.current.style.width = `${vw}px`;
        outerRef.current.style.height = `${vh}px`;
      }
      if (innerRef.current) {
        innerRef.current.style.left = `${(vw - SCREEN_W * scale) / 2}px`;
        innerRef.current.style.top = `${(vh - SCREEN_H * scale) / 2}px`;
        innerRef.current.style.transform = `scale(${scale})`;
      }
    };

    update();
    // window resize fires on orientation change but NOT on keyboard on iOS.
    // On Android, interactive-widget=resizes-visual prevents it firing for keyboard too.
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      ref={outerRef}
      style={{ position: 'fixed', top: 0, left: 0, overflow: 'hidden', background: '#f5f1ea' }}
    >
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          width: SCREEN_W,
          height: SCREEN_H,
          transformOrigin: 'top left',
        }}
      >
        <div className="absolute inset-0 overflow-hidden bg-cream">{children}</div>
      </div>
    </div>
  );
}
