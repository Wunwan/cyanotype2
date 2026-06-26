import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import PaintCanvas, { type PaintCanvasHandle } from '../components/PaintCanvas';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { ROUTES, progressStep } from '../lib/flow';

const PANEL = { left: 28, top: 174, w: 346, h: 475 };
const COVERAGE_TARGET = 0.15;

export default function Coat() {
  const navigate = useNavigate();
  const { setPaintedMask, negativeImage, userImage } = useFlow();
  const canvasRef = useRef<PaintCanvasHandle>(null);
  const [coverage, setCoverage] = useState(0);
  const [showImage, setShowImage] = useState(false);
  const enough = coverage >= COVERAGE_TARGET;

  const previewBlob = negativeImage ?? userImage;
  const imageUrl = useObjectUrl(previewBlob);

  const onDone = async () => {
    const blob = await canvasRef.current?.toBlob();
    if (blob) setPaintedMask(blob);
    navigate(ROUTES.darkroom);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <ProgressIndicator step={progressStep(ROUTES.coat)} />
        <p className="absolute left-[34px] top-[93px] whitespace-nowrap text-[14px] text-ink">
          Coat the paper
        </p>

        {/* Visibility toggle — top-right corner of the paper panel */}
        {imageUrl && (
          <button
            onClick={() => setShowImage((v) => !v)}
            aria-label={showImage ? 'Hide image' : 'Show image position'}
            className="absolute z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 shadow-sm active:scale-95"
            style={{ left: PANEL.left + PANEL.w - 38, top: PANEL.top + 8 }}
          >
            {showImage ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}

        {/* Paper panel */}
        <div
          className="absolute overflow-hidden rounded-[1px] bg-[rgba(252,251,246,0.35)] shadow-[inset_0_0_40px_rgba(0,0,0,0.04)]"
          style={{ left: PANEL.left, top: PANEL.top, width: PANEL.w, height: PANEL.h }}
        >
          {/* Image position preview — shown when eye toggle is on */}
          {imageUrl && (
            <motion.img
              src={imageUrl}
              alt=""
              aria-hidden
              animate={{ opacity: showImage ? 0.35 : 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}

          <PaintCanvas
            ref={canvasRef}
            width={PANEL.w}
            height={PANEL.h}
            onCoverage={setCoverage}
            className="absolute inset-0"
          />
        </div>

        {/* Bulldog clip on the top edge of the paper. */}
        <img
          src="/assets/clip-top-image120.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-[126px] top-[126px] w-[150px]"
        />

        <p className="copy absolute left-1/2 top-[672px] w-[222px] -translate-x-1/2 text-center text-[16px] text-ink">
          Brush cyanotype chemicals on an even layer and let it dry.
        </p>

        <div className="absolute left-1/2 top-[757px] -translate-x-1/2">
          <motion.div
            animate={{ opacity: enough ? 1 : 0.4, scale: enough ? 1 : 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <PillButton disabled={!enough} onClick={onDone}>
              done
            </PillButton>
          </motion.div>
        </div>
      </div>
    </PaperBackground>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
