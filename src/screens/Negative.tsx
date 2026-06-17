import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useImageMeta } from '../hooks/useImageMeta';
import { invertImage } from '../lib/imageProcessing';
import { ROUTES, progressStep } from '../lib/flow';

const BAR_ASPECT = 5.818; // silver-bar-image156 width / height
const STOP_MARGIN = 30; // bar stops this far above the photo's bottom edge

export default function Negative() {
  const navigate = useNavigate();
  const { userImage, setNegativeImage } = useFlow();
  const { url, aspect } = useImageMeta(userImage);
  const [locked, setLocked] = useState(false);

  // Adaptive frame: keep the photo's original proportion (same as the preview
  // page) — horizontal stays horizontal, vertical stays vertical.
  const frame = useMemo(() => {
    const MAXW = 322;
    const MAXH = 396;
    const landscape = aspect >= 1;
    const w = landscape ? MAXW : Math.round(MAXH * aspect);
    const h = landscape ? Math.round(MAXW / aspect) : MAXH;
    const top = Math.round(392 - h / 2); // vertically centred in the page
    const left = Math.round((402 - w) / 2);
    const barH = Math.round(w / BAR_ASPECT);
    // Bar rests just above the photo; drags down and stops STOP_MARGIN before the bottom.
    const maxDrag = Math.max(40, h - STOP_MARGIN);
    return { w, h, top, left, barH, maxDrag, bottom: top + h };
  }, [aspect]);

  const y = useMotionValue(0);
  const progress = useTransform(y, [0, frame.maxDrag], [0, 1]); // clamped 0..1
  const filter = useMotionTemplate`invert(${progress})`;

  useMotionValueEvent(y, 'change', (v) => {
    if (!locked && v >= frame.maxDrag * 0.95) setLocked(true);
  });

  const onDone = async () => {
    if (userImage) {
      const neg = await invertImage(userImage);
      setNegativeImage(neg);
    }
    navigate(ROUTES.coat);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <ProgressIndicator step={progressStep(ROUTES.negative)} />
        <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
          Flip to negative
        </p>

        {/* The photo, at its original proportion — inverts live as the bar drags. */}
        <div
          className="absolute overflow-hidden rounded-[2px] bg-black/5 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.45)]"
          style={{ left: frame.left, top: frame.top, width: frame.w, height: frame.h }}
        >
          {url && (
            <motion.img
              src={url}
              alt="Your photo"
              className="h-full w-full object-cover"
              style={{ filter }}
              draggable={false}
            />
          )}
        </div>

        {/* Draggable silver bar — width matches the photo, stops before the bottom. */}
        <motion.div
          className="absolute cursor-grab touch-none active:cursor-grabbing"
          style={{ left: frame.left, top: frame.top - frame.barH, width: frame.w, y }}
          drag="y"
          dragConstraints={{ top: 0, bottom: frame.maxDrag }}
          dragElastic={0}
          dragMomentum={false}
        >
          <img
            src="/assets/silver-bar-image156.png"
            alt=""
            aria-hidden
            className="w-full select-none"
            draggable={false}
          />
        </motion.div>

        {/* Down-arrow hint below the photo. The asset is horizontal, so it's
            rotated 90° inside a sized wrapper that defines its (taller) bounds. */}
        <div
          className="pointer-events-none absolute opacity-70"
          style={{ left: frame.left + 16, top: frame.bottom + 8, width: 16, height: 104 }}
        >
          <img
            src="/assets/arrow-down.svg"
            alt=""
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[15px] w-[104px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90"
          />
        </div>

        <p className="copy absolute left-1/2 top-[704px] w-[212px] -translate-x-1/2 text-center text-[16px] text-ink">
          Drag down and watch the colors turn inside out.
        </p>

        <div className="absolute left-1/2 top-[780px] -translate-x-1/2">
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
    </PaperBackground>
  );
}
