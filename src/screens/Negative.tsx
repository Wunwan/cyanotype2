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
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useImageMeta } from '../hooks/useImageMeta';
import { invertImage } from '../lib/imageProcessing';
import { ROUTES, progressStep } from '../lib/flow';

// Invert completes after this much travel (~60% down the screen). The bar can
// still be pulled further — all the way to the bottom.
const LOCK = 322;
// Bar is ~60px tall and starts at y=202. 606px travel lands its bottom edge at
// ~868px — right at the frame bottom (874) without ever exceeding it.
const MAX_DRAG = 606;

export default function Negative() {
  const navigate = useNavigate();
  const { userImage, setNegativeImage } = useFlow();
  const { url } = useImageMeta(userImage);
  const [locked, setLocked] = useState(false);

  const y = useMotionValue(0);
  const progress = useTransform(y, [0, LOCK], [0, 1]); // clamped 0..1
  const filter = useMotionTemplate`invert(${progress})`;

  useMotionValueEvent(y, 'change', (v) => {
    if (!locked && v >= LOCK * 0.95) setLocked(true);
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

        {/* The photo — inverts live as the bar is dragged down. */}
        <div className="absolute left-[51px] top-[232px] h-[368px] w-[300px] overflow-hidden rounded-[2px] bg-black/5 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.45)]">
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

        {/* Draggable silver bar handle — can be pulled all the way to the bottom. */}
        <motion.div
          className="absolute left-[27px] top-[202px] w-[347px] cursor-grab touch-none active:cursor-grabbing"
          style={{ y }}
          drag="y"
          dragConstraints={{ top: 0, bottom: MAX_DRAG }}
          dragElastic={0}
          dragMomentum={false}
        >
          <img src="/assets/silver-bar-image156.png" alt="" aria-hidden className="w-full select-none" draggable={false} />
        </motion.div>

        {/* Small down-arrow hint, just below-left of the photo (asset is
            horizontal — explicit height + rotate to point down). */}
        <img
          src="/assets/arrow-down.svg"
          alt=""
          aria-hidden
          className="absolute left-[78px] top-[632px] h-[6px] w-[44px] origin-center rotate-90 opacity-70"
        />

        <p className="copy absolute left-1/2 top-[672px] w-[212px] -translate-x-1/2 text-center text-[16px] text-ink">
          Drag down and watch the colors turn inside out.
        </p>

        <div className="absolute left-1/2 top-[757px] -translate-x-1/2">
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
