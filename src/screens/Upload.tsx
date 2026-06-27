import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import BackButton from '../components/BackButton';
import { useFlow } from '../context/FlowContext';
import { ROUTES, nextRoute, progressStep } from '../lib/flow';

// Sewing buttons that fall in from above with a springy stagger.
const FALLING_BUTTONS = [
  { src: '/assets/button-image169.webp', left: 248, top: 731, size: 154, delay: 0 },
  { src: '/assets/button-image143.webp', left: 38,  top: 757, w: 55, h: 63, delay: 0.1 },
  { src: '/assets/button-image167.webp', left: 83,  top: 820, size: 56, delay: 0.2 },
  { src: '/assets/button-image168.webp', left: 244, top: 825, size: 46, delay: 0.3 },
];

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { flowMode, setUserImages, setUserImage } = useFlow();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    if (files.length === 0) return;
    setUserImages(files);
    // Express mode skips Negative (where the composite is normally built),
    // so use the first image directly as userImage.
    if (flowMode === 'express') setUserImage(files[0]);
    const next = nextRoute(ROUTES.upload, flowMode);
    if (next) navigate(next);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <BackButton />
        {flowMode === 'full' && <ProgressIndicator step={progressStep(ROUTES.upload)} />}

        <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
          Choose a photo
        </p>

        {/* Hanging assembly — wire, clips, card and upload button sway together. */}
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: '201px 200px' }}
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 1.6, -1.1, 0.6, -0.3, 0] }}
          transition={{
            delay: 0.85,
            duration: 1.3,
            ease: 'easeInOut',
            times: [0, 0.2, 0.45, 0.65, 0.85, 1],
          }}
        >
          {/* Wire / rope spanning full width, slight clockwise tilt */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: -7, top: 139, width: 565.059, height: 137.568 }}
          >
            <img
              src="/assets/wire-image175.webp"
              alt=""
              aria-hidden
              draggable={false}
              className="flex-none select-none"
              style={{ width: 561, height: 116, transform: 'rotate(2.21deg)' }}
            />
          </div>

          {/* Paper card — stored as landscape, rotated ~83° to appear portrait */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: 40.62, top: 229.15, width: 321.274, height: 384.099 }}
          >
            <div
              className="relative flex-none overflow-hidden"
              style={{ width: 353.82, height: 282.231, transform: 'rotate(83.36deg) scaleY(-1)' }}
            >
              <img
                src="/assets/card-image139.webp"
                alt=""
                aria-hidden
                draggable={false}
                className="absolute max-w-none select-none pointer-events-none"
                style={{ height: '100.01%', left: '-22.32%', top: '-0.01%', width: '146.14%' }}
              />
            </div>
          </div>

          {/* Left paperclip */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: 161, top: 205, width: 73.849, height: 94.456 }}
          >
            <img
              src="/assets/clip-image172.webp"
              alt=""
              aria-hidden
              draggable={false}
              className="flex-none select-none"
              style={{ width: 83.404, height: 45.53, transform: 'rotate(67.63deg)' }}
            />
          </div>

          {/* Right paperclip */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: 325, top: 222, width: 46.075, height: 55.857 }}
          >
            <img
              src="/assets/clip-image172.webp"
              alt=""
              aria-hidden
              draggable={false}
              className="flex-none select-none"
              style={{ width: 49.049, height: 26.776, transform: 'rotate(116.91deg)' }}
            />
          </div>

          {/* Upload tap target — centered on the card */}
          <button
            type="button"
            aria-label="Upload image"
            onClick={() => inputRef.current?.click()}
            className="absolute flex -translate-x-1/2 flex-col items-center gap-[15px]"
            style={{ left: 'calc(50% + 3.5px)', top: 374 }}
          >
            {/* Icon sits in a 43×43 slot with 8.33% padding on each side */}
            <span className="relative size-[43px]">
              <img
                src="/assets/icon-upload.svg"
                alt=""
                aria-hidden
                className="absolute inset-[8.33%] block w-full h-full"
              />
            </span>
            <span className="text-[16px] text-ink">Upload images</span>
            <span className="text-[12px] text-ink/50">up to 5</span>
          </button>
        </motion.div>

        <p className="copy absolute left-1/2 top-[687px] w-[167px] -translate-x-1/2 text-center text-[16px] text-ink">
          Choose what you'd like to capture in blue.
        </p>

        {/* Falling sewing buttons */}
        {FALLING_BUTTONS.map((b, i) => {
          const w = b.w ?? b.size!;
          const h = b.h ?? b.size!;
          return (
            <motion.img
              key={i}
              src={b.src}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute object-contain"
              style={{ left: b.left, top: b.top, width: w, height: h, zIndex: 5 }}
              initial={{ y: -(b.top + 160), opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 210,
                damping: 13,
                delay: b.delay,
                opacity: { duration: 0.2, delay: b.delay },
              }}
            />
          );
        })}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>
    </PaperBackground>
  );
}
