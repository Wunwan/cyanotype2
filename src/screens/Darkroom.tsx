import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Decoration from '../components/Decoration';
import ProgressIndicator from '../components/ProgressIndicator';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { DARK_GRADIENT } from '../lib/theme';
import { ROUTES, progressStep } from '../lib/flow';

// Darkroom tools, populated one at a time (fade + scale spring, ~200ms stagger).
// Composition matches Figma (node 890:1027): pressed yellow+white flowers as a
// left cluster, cream card centre, glass jar right, dish centre-low, tweezers low-right.
const TOOLS = [
  { src: '/assets/flower-yellow.png', left: 26, top: 286, width: 124, height: 156, rotate: -4, idle: 'float' as const, idleAmount: 3, delay: 0 },
  { src: '/assets/flower-white.png', left: 30, top: 392, width: 92, height: 90, rotate: 6, idle: 'float' as const, idleAmount: 2.5, delay: 0.2 },
  { src: '/assets/paper-card-image154.png', left: 170, top: 272, width: 112, height: 112, rotate: -12, idle: 'rotate' as const, idleAmount: 1.2, delay: 0.4 },
  { src: '/assets/jar-image155.png', left: 252, top: 292, width: 86, height: 136, rotate: 0, idle: 'float' as const, idleAmount: 2, delay: 0.6 },
  { src: '/assets/dish-image152.png', left: 110, top: 404, width: 110, height: 110, rotate: -8, idle: 'float' as const, idleAmount: 2.5, delay: 0.8 },
  { src: '/assets/tweezers-image166.png', left: 236, top: 400, width: 128, height: 142, rotate: 28, idle: 'rotate' as const, idleAmount: 1.2, delay: 1 },
];

const NARRATION = ['3 hours have passed', '2 hours have passed', '1 hour has passed'];

export default function Darkroom() {
  const navigate = useNavigate();
  const { flowMode } = useFlow();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Narrative countdown: 3 steps × 3s = 9s total, then the "next" button pops in.
  useEffect(() => {
    const t1 = setTimeout(() => setIdx(1), 3000);
    const t2 = setTimeout(() => setIdx(2), 6000);
    const t3 = setTimeout(() => setDone(true), 9000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundImage: DARK_GRADIENT }}
    >
      {/* Very faint paper grain over the gradient — soft-light so it doesn't
          shift the Prussian-blue hue (matches Figma's IMG_5276 @ ~10%). */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: "url('/assets/paper-texture.png')",
          backgroundSize: 'cover',
          mixBlendMode: 'soft-light',
        }}
      />

      {flowMode === 'full' && <ProgressIndicator step={progressStep(ROUTES.darkroom)} />}
      <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
        Brew in the darkroom
      </p>
      <p className="copy absolute left-1/2 top-[228px] w-[323px] -translate-x-1/2 text-center text-[14px] text-ink">
        The image absorbs the chemicals and dries in darkness to prevent premature
        exposure.
      </p>

      {/* Darkroom tools */}
      {TOOLS.map((t) => (
        <Decoration
          key={t.src}
          src={t.src}
          left={t.left}
          top={t.top}
          width={t.width}
          height={t.height}
          rotate={t.rotate}
          from={{ x: 0, y: 0 }} /* fade + scale in place, no slide */
          delay={t.delay}
          idle={t.idle}
          idleAmount={t.idleAmount}
          idleDuration={5}
          zIndex={10}
        />
      ))}

      {/* Narrative countdown */}
      <div className="absolute left-1/2 top-[672px] h-[24px] -translate-x-1/2">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            className="whitespace-nowrap text-[15px] text-white/90"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {NARRATION[idx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* "next" pops in with overshoot once the count finishes */}
      <div className="absolute left-1/2 top-[736px] -translate-x-1/2">
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <PillButton className="text-bone-2" onClick={() => navigate(ROUTES.process)}>
                next
              </PillButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
