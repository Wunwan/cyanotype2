import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Decoration from '../components/Decoration';
import ProgressIndicator from '../components/ProgressIndicator';
import BackButton from '../components/BackButton';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { DARK_GRADIENT } from '../lib/theme';
import { ROUTES, progressStep } from '../lib/flow';

// Darkroom tools, populated one at a time (fade + scale spring, ~200ms stagger).
// Positions match Figma node 890:1027 (tool group at left 30 / top 270).
const TOOLS = [
  { src: '/assets/flower-yellow.webp', left: 26, top: 349, width: 133, height: 140, rotate: -4, idle: 'float' as const, idleAmount: 3, delay: 0 },
  { src: '/assets/flower-white.webp', left: 24, top: 444, width: 99, height: 92, rotate: 6, idle: 'float' as const, idleAmount: 2.5, delay: 0.2 },
  { src: '/assets/paper-card-trim.webp', left: 169, top: 336, width: 136, height: 101, rotate: -22, idle: 'rotate' as const, idleAmount: 1.2, delay: 0.4 },
  { src: '/assets/jar-trim.webp', left: 240, top: 360, width: 86, height: 139, rotate: 0, idle: 'float' as const, idleAmount: 2, delay: 0.6 },
  { src: '/assets/dish-trim.webp', left: 110, top: 506, width: 98, height: 96, rotate: -14, idle: 'float' as const, idleAmount: 2.5, delay: 0.8 },
  { src: '/assets/tweezers-trim.webp', left: 256, top: 508, width: 130, height: 80, rotate: 38, idle: 'rotate' as const, idleAmount: 1.2, delay: 1 },
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
      <BackButton light />
      {flowMode === 'full' && <ProgressIndicator step={progressStep(ROUTES.darkroom)} />}
      <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
        Brew in the darkroom
      </p>
      <p className="absolute left-1/2 top-[231px] w-[323px] -translate-x-1/2 text-center text-[14px] leading-snug text-ink">
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
      <div className="absolute left-1/2 top-[674px] h-[24px] -translate-x-1/2">
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
      <div className="absolute left-1/2 top-[716px] -translate-x-1/2">
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <PillButton textColor="#FFFDF9" onClick={() => navigate(ROUTES.process)}>
                next
              </PillButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
