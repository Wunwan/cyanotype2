import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import BackButton from '../components/BackButton';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useObjectUrls } from '../hooks/useObjectUrls';
import { compositeImages, invertImage } from '../lib/imageProcessing';
import { ROUTES, progressStep } from '../lib/flow';

const PANEL = { top: 204, left: 34, w: 346, h: 457 };
const BAR = { w: 385, h: 66, top: 178, left: Math.round((402 - 385) / 2) };

// Card width (px) indexed by image count - 1.
const CARD_SIZE = [240, 155, 138, 122, 110];

// Scatter offsets from panel center (dx, dy in px, r in degrees), by count.
const SCATTER = [
  [{ dx: 0, dy: 0, r: 0 }],
  [{ dx: -68, dy: -5, r: -4 }, { dx: 68, dy: 5, r: 5 }],
  [{ dx: -78, dy: -28, r: -5 }, { dx: 62, dy: -38, r: 4 }, { dx: -8, dy: 52, r: -3 }],
  [{ dx: -72, dy: -45, r: -5 }, { dx: 66, dy: -48, r: 6 }, { dx: -68, dy: 46, r: 4 }, { dx: 64, dy: 38, r: -5 }],
  [{ dx: -82, dy: -40, r: -6 }, { dx: 10, dy: -52, r: 3 }, { dx: 82, dy: -30, r: 6 }, { dx: -48, dy: 46, r: -4 }, { dx: 52, dy: 50, r: 5 }],
];

export default function Negative() {
  const navigate = useNavigate();
  const { userImages, setUserImage, setNegativeImage } = useFlow();
  const imageUrls = useObjectUrls(userImages);
  const [locked, setLocked] = useState(false);

  const count = Math.max(1, userImages.length);
  const cardW = CARD_SIZE[count - 1];
  const positions = SCATTER[count - 1];

  // Lock once bar clears the bottom-most card.
  const lowestCardBottom = Math.max(
    ...positions.map((p) => PANEL.top + PANEL.h / 2 + p.dy + cardW / 2),
  );
  const lockDist = Math.max(60, lowestCardBottom - (BAR.top + BAR.h));
  const maxDrag = 874 - (BAR.top + BAR.h);

  const y = useMotionValue(0);
  const progress = useTransform(y, [0, lockDist], [0, 1]);
  const filter = useMotionTemplate`invert(${progress})`;

  useMotionValueEvent(y, 'change', (v) => {
    if (!locked && v >= lockDist * 0.95) setLocked(true);
  });

  const onDone = async () => {
    if (userImages.length > 0) {
      const composite = await compositeImages(userImages);
      setUserImage(composite);
      const neg = await invertImage(composite);
      setNegativeImage(neg);
    }
    navigate(ROUTES.coat);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <BackButton />
        <ProgressIndicator step={progressStep(ROUTES.negative)} />
        <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
          Flip to negative
        </p>

        {/* Translucent panel */}
        <div
          className="absolute bg-[rgba(217,217,217,0.3)]"
          style={{ left: PANEL.left, top: PANEL.top, width: PANEL.w, height: PANEL.h }}
        />

        {/* Scattered photo cards — all share the same live invert filter */}
        {imageUrls.map((url, i) => {
          const pos = positions[i];
          return (
            <motion.div
              key={i}
              className="absolute overflow-hidden rounded-[2px] shadow-[0_4px_8px_rgba(0,0,0,0.22)]"
              style={{
                width: cardW,
                height: cardW,
                left: PANEL.left + PANEL.w / 2 + pos.dx - cardW / 2,
                top: PANEL.top + PANEL.h / 2 + pos.dy - cardW / 2,
                rotate: pos.r,
                filter,
                zIndex: i + 1,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.08 }}
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </motion.div>
          );
        })}

        {/* Wide silver rod */}
        <motion.div
          className="absolute cursor-grab touch-none active:cursor-grabbing"
          style={{ left: BAR.left, top: BAR.top, width: BAR.w, y, zIndex: 10 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: maxDrag }}
          dragElastic={0}
          dragMomentum={false}
        >
          <img
            src="/assets/silver-bar-image156.webp"
            alt=""
            aria-hidden
            className="w-full select-none"
            draggable={false}
          />
        </motion.div>

        {/* Arrow hint + caption + done */}
        <div className="absolute left-[81px] top-[682px] flex items-end gap-[14px]">
          <div className="relative h-[110px] w-[14px] shrink-0 opacity-70">
            <img
              src="/assets/arrow-down.svg"
              alt=""
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[14px] w-[110px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90"
            />
          </div>
          <div className="flex w-[212px] flex-col items-center gap-[20px]">
            <p className="copy text-center text-[16px] text-ink">
              Drag down and watch the colors turn inside out.
            </p>
            <motion.div
              animate={{ opacity: locked ? 1 : 0.4, scale: locked ? 1 : 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <PillButton disabled={!locked} onClick={onDone}>
                done
              </PillButton>
            </motion.div>
          </div>
        </div>
      </div>
    </PaperBackground>
  );
}
