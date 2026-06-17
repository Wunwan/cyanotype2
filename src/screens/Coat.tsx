import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import PaintCanvas, { type PaintCanvasHandle } from '../components/PaintCanvas';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { ROUTES, progressStep } from '../lib/flow';

const PANEL = { left: 28, top: 174, w: 346, h: 475 };
const COVERAGE_TARGET = 0.15; // ~15% painted unlocks "done"

export default function Coat() {
  const navigate = useNavigate();
  const { setPaintedMask } = useFlow();
  const canvasRef = useRef<PaintCanvasHandle>(null);
  const [coverage, setCoverage] = useState(0);
  const enough = coverage >= COVERAGE_TARGET;

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

        {/* Paper to be coated — the canvas sits exactly over this panel. */}
        <div
          className="absolute rounded-[1px] bg-[rgba(252,251,246,0.35)] shadow-[inset_0_0_40px_rgba(0,0,0,0.04)]"
          style={{ left: PANEL.left, top: PANEL.top, width: PANEL.w, height: PANEL.h }}
        >
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
