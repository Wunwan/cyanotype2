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

// Layout from Figma node 902:1143.
const PANEL = { top: 204, left: 34, w: 346, h: 457 };
const BAR = { w: 385, h: 66, top: 178, left: Math.round((402 - 385) / 2) };

export default function Negative() {
  const navigate = useNavigate();
  const { userImage, setNegativeImage } = useFlow();
  const { url, aspect } = useImageMeta(userImage);
  const [locked, setLocked] = useState(false);

  // The image keeps its original proportion, centred inside the translucent panel.
  const img = useMemo(() => {
    const MAXW = 282;
    const MAXH = 336;
    const landscape = aspect >= 1;
    const w = landscape ? MAXW : Math.round(MAXH * aspect);
    const h = landscape ? Math.round(MAXW / aspect) : MAXH;
    const left = Math.round(PANEL.left + (PANEL.w - w) / 2);
    const top = Math.round(PANEL.top + (PANEL.h - h) / 2);
    return { w, h, left, top };
  }, [aspect]);

  // Invert completes once the bar's bottom reaches the photo's bottom edge…
  const lockDist = Math.max(60, img.top + img.h - (BAR.top + BAR.h));
  // …but the bar can keep dragging all the way to the bottom edge of the frame.
  const maxDrag = 874 - (BAR.top + BAR.h);
  const y = useMotionValue(0);
  const progress = useTransform(y, [0, lockDist], [0, 1]);
  const filter = useMotionTemplate`invert(${progress})`;

  useMotionValueEvent(y, 'change', (v) => {
    if (!locked && v >= lockDist * 0.95) setLocked(true);
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

        {/* Translucent panel holding the photo (original proportion, inverts live). */}
        <div
          className="absolute bg-[rgba(217,217,217,0.3)]"
          style={{ left: PANEL.left, top: PANEL.top, width: PANEL.w, height: PANEL.h }}
        >
          {url && (
            <motion.img
              src={url}
              alt="Your photo"
              className="absolute rounded-[1px] object-cover shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
              style={{
                left: img.left - PANEL.left,
                top: img.top - PANEL.top,
                width: img.w,
                height: img.h,
                filter,
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Wide silver rod — drag it down to develop the negative. */}
        <motion.div
          className="absolute cursor-grab touch-none active:cursor-grabbing"
          style={{ left: BAR.left, top: BAR.top, width: BAR.w, y }}
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

        {/* Arrow hint + caption + done, as a row (Figma node 984:262). */}
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
