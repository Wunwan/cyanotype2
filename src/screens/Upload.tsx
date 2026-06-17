import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import { useFlow } from '../context/FlowContext';
import { ROUTES, nextRoute, progressStep } from '../lib/flow';

// Sewing buttons that "spawn" above the viewport and fall to the bottom with a
// springy bounce, staggered ~100ms (Figma coords from node 870:907).
const FALLING_BUTTONS = [
  { src: '/assets/button-image169.png', left: 248, top: 731, size: 154, delay: 0 },
  { src: '/assets/button-image143.png', left: 38, top: 757, w: 55, h: 63, delay: 0.1 },
  { src: '/assets/button-image167.png', left: 83, top: 820, size: 56, delay: 0.2 },
  { src: '/assets/button-image168.png', left: 244, top: 825, size: 46, delay: 0.3 },
];

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { flowMode, setUserImage } = useFlow();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUserImage(file);
    const next = nextRoute(ROUTES.upload, flowMode); // full → preview, express → process
    if (next) navigate(next);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        {flowMode === 'full' && <ProgressIndicator step={progressStep(ROUTES.upload)} />}

        <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
          Choose a photo
        </p>

        {/* Hanging assembly — clothesline, clips and the polaroid swing together
            from the top center, and give a little sway when the buttons land. */}
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: '201px 205px' }}
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 1.6, -1.1, 0.6, -0.3, 0] }}
          transition={{
            delay: 0.85,
            duration: 1.3,
            ease: 'easeInOut',
            times: [0, 0.2, 0.45, 0.65, 0.85, 1],
          }}
        >
          {/* These Figma group SVGs have no intrinsic size (preserveAspectRatio=none),
              so width AND height must be set explicitly or they stretch to 150px. */}
          {/* Clothesline sits behind the paper… */}
          <img
            src="/assets/clothesline-group5.svg"
            alt=""
            aria-hidden
            className="absolute left-[-3px] top-[194px] h-[64px] w-[407px]"
          />

          <button
            type="button"
            aria-label="Upload image"
            onClick={() => inputRef.current?.click()}
            className="absolute left-[39.55px] top-[243.96px] h-[374px] w-[308px] overflow-hidden rounded-[2px] bg-[#f4eedd] shadow-[0_10px_26px_-14px_rgba(0,0,0,0.5)]"
          >
            {/* Clean paper grain (the photo asset had baked-in white margins). */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: "url('/assets/paper-texture.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                mixBlendMode: 'multiply',
              }}
            />
            <span className="absolute inset-x-0 top-[142px] flex flex-col items-center gap-[15px]">
              <img src="/assets/icon-upload.svg" alt="" aria-hidden className="h-[43px] w-[43px]" />
              <span className="text-[16px] text-ink">Upload image</span>
            </span>
          </button>

          {/* …and the clothespins clip it from the front (on top of the paper). */}
          <img
            src="/assets/clothespins-group4.svg"
            alt=""
            aria-hidden
            className="absolute left-[147px] top-[208px] h-[71px] w-[230px]"
          />
        </motion.div>

        <p className="copy absolute left-1/2 top-[687px] w-[167px] -translate-x-1/2 text-center text-[16px] text-ink">
          Choose what you'd like to capture in blue.
        </p>

        {/* Falling sewing buttons. */}
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
          className="hidden"
          onChange={onPick}
        />
      </div>
    </PaperBackground>
  );
}
