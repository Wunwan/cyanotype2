import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import PaintCanvas, { type BrushType, type PaintCanvasHandle } from '../components/PaintCanvas';
import { PillButton } from '../components/PillButton';
import BackButton from '../components/BackButton';
import { useFlow } from '../context/FlowContext';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { ROUTES, nextRoute, progressStep } from '../lib/flow';

const PANEL = { left: 28, top: 174, w: 346, h: 475 };
const COVERAGE_TARGET = 0.15;

const BRUSH_OPTIONS: { type: BrushType; label: string; icon: () => React.ReactNode }[] = [
  { type: 'brush', label: 'Round brush', icon: BrushIcon },
  { type: 'bristle', label: 'Bristle brush', icon: BristleIcon },
  { type: 'sponge', label: 'Sponge', icon: SpongeIcon },
];

const SIZE_PRESETS = [
  { label: 'S', value: 10 },
  { label: 'M', value: 18 },
  { label: 'L', value: 28 },
];

export default function Coat() {
  const navigate = useNavigate();
  const { flowMode, setPaintedMask, negativeImage, userImage } = useFlow();
  const canvasRef = useRef<PaintCanvasHandle>(null);
  const [coverage, setCoverage] = useState(0);
  const [showImage, setShowImage] = useState(false);
  const [brushType, setBrushType] = useState<BrushType>('brush');
  const [brushSize, setBrushSize] = useState(18);
  const enough = coverage >= COVERAGE_TARGET;

  const previewBlob = negativeImage ?? userImage;
  const imageUrl = useObjectUrl(previewBlob);

  const onDone = async () => {
    const blob = await canvasRef.current?.toBlob();
    if (blob) setPaintedMask(blob);
    navigate(nextRoute(ROUTES.coat, flowMode ?? 'full') ?? ROUTES.darkroom);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <BackButton />
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
            brushType={brushType}
            brushSize={brushSize}
            className="absolute inset-0"
          />
        </div>

        {/* Bulldog clip on the top edge of the paper. */}
        <img
          src="/assets/clip-top-image120.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-[126px] top-[126px] w-[150px]"
        />

        {/* Brush toolbar */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ top: PANEL.top + PANEL.h + 18 }}
        >
          {/* Brush type selector */}
          <div className="flex items-center gap-2">
            {BRUSH_OPTIONS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                aria-label={label}
                onClick={() => setBrushType(type)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  brushType === type ? 'bg-ink text-cream' : 'bg-black/5 text-ink'
                }`}
              >
                <Icon />
              </button>
            ))}

            {/* Divider */}
            <div className="mx-1 h-5 w-px bg-ink/20" />

            {/* Fill all */}
            <button
              aria-label="Fill entire page"
              onClick={() => canvasRef.current?.fill()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-ink active:bg-ink active:text-cream"
            >
              <FillIcon />
            </button>

            {/* Divider */}
            <div className="mx-1 h-5 w-px bg-ink/20" />

            {/* Size presets */}
            {SIZE_PRESETS.map(({ label, value }) => (
              <button
                key={label}
                aria-label={`Brush size ${label}`}
                onClick={() => setBrushSize(value)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
                  brushSize === value ? 'bg-ink text-cream' : 'bg-black/5 text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute left-1/2 top-[775px] -translate-x-1/2">
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

function BrushIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17a4 4 0 0 1 4-4h.5L18 2l4 4L11 17v.5a4 4 0 0 1-4 4 4 4 0 0 1-4-4.5z" />
    </svg>
  );
}

function BristleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="7" y1="3" x2="7" y2="16" />
      <line x1="10" y1="2" x2="10" y2="16" />
      <line x1="13" y1="3" x2="13" y2="16" />
      <line x1="16" y1="2" x2="16" y2="16" />
      <rect x="5" y="16" width="13" height="5" rx="1" />
    </svg>
  );
}

function FillIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 6l-8.5 8.5a2.12 2.12 0 0 0 3 3L19 9l-3-3z" />
      <path d="M2 22h4" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SpongeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="3" />
      <circle cx="8" cy="5" r="2" />
      <circle cx="14" cy="4" r="1.5" />
      <circle cx="19" cy="6" r="1.5" />
    </svg>
  );
}
