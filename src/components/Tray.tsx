import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';

export type Orientation = 'portrait' | 'landscape';

/**
 * The silver tray that holds the user's photo (screen 3).
 *
 * Uses the trimmed tray asset (transparent padding removed) so the tray fills
 * its box with no blank margins. The asset is landscape; for portrait photos we
 * rotate the frame 90° and size the container to match. The photo sits upright
 * in the flat inner opening with object-contain — never cropped or bleeding.
 */
const ASPECT = 961 / 736; // trimmed tray content aspect (landscape)

// Flat inner opening as a fraction of the visible tray footprint.
const INNER = {
  landscape: { x: 0.12, y: 0.16 },
  portrait: { x: 0.16, y: 0.12 },
};

export default function Tray({
  imageUrl,
  orientation,
  width,
  imageStyle,
  photoFadeDelay = 0.2,
  overlay,
}: {
  imageUrl: string | null;
  orientation: Orientation;
  /** Horizontal footprint of the tray in px. */
  width: number;
  imageStyle?: CSSProperties;
  photoFadeDelay?: number;
  overlay?: React.ReactNode;
}) {
  const portrait = orientation === 'portrait';
  const W = width;
  const H = portrait ? W * ASPECT : W / ASPECT;
  const inset = INNER[orientation];

  return (
    <div className="relative" style={{ width: W, height: H }}>
      {/* Tray frame — fills the footprint; rotated for portrait. */}
      {portrait ? (
        <img
          src="/assets/silver-tray-trim.png"
          alt=""
          aria-hidden
          className="absolute left-1/2 top-1/2 max-w-none"
          style={{ width: H, height: W, transform: 'translate(-50%, -50%) rotate(90deg)' }}
        />
      ) : (
        <img
          src="/assets/silver-tray-trim.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full"
        />
      )}

      {/* Photo in the inner opening — upright, contained. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${inset.x * 100}%`,
          right: `${inset.x * 100}%`,
          top: `${inset.y * 100}%`,
          bottom: `${inset.y * 100}%`,
        }}
      >
        {imageUrl && (
          <motion.img
            src={imageUrl}
            alt="Your photo"
            className="h-full w-full object-contain"
            style={imageStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: photoFadeDelay }}
            draggable={false}
          />
        )}
        {overlay}
      </div>
    </div>
  );
}
