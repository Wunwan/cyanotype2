import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExposureStage from '../components/ExposureStage';
import ProgressIndicator from '../components/ProgressIndicator';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { processCyanotype, processCyanotypeWithMask } from '../lib/imageProcessing';
import { DARK_GRADIENT } from '../lib/theme';
import { ROUTES, progressStep } from '../lib/flow';

const SECONDS = 5;

export default function Process() {
  const navigate = useNavigate();
  const { flowMode, userImage, negativeImage, paintedMask, finalPrint, setFinalPrint } = useFlow();

  // Full users expose the negative; express users the original.
  const inputUrl = useObjectUrl(negativeImage ?? userImage);
  const finalUrl = useObjectUrl(finalPrint);

  const [count, setCount] = useState(SECONDS);
  const [ready, setReady] = useState(false);

  // Kick off the (stubbed) cyanotype processing as the countdown runs.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userImage) return;
      const out = paintedMask
        ? await processCyanotypeWithMask(userImage, paintedMask)
        : await processCyanotype(userImage);
      if (!cancelled) setFinalPrint(out);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5-second countdown.
  useEffect(() => {
    const iv = setInterval(() => setCount((c) => Math.max(1, c - 1)), 1000);
    const end = setTimeout(() => {
      setReady(true);
      clearInterval(iv);
    }, SECONDS * 1000);
    return () => {
      clearInterval(iv);
      clearTimeout(end);
    };
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundImage: DARK_GRADIENT }}
    >
      {flowMode === 'full' && <ProgressIndicator step={progressStep(ROUTES.process)} />}
      <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
        One last rinse
      </p>

      {/* Translucent wash basin holding the exposing print. */}
      <div className="absolute left-1/2 top-[149px] flex h-[501px] w-[346px] -translate-x-1/2 items-center justify-center rounded-[2px] bg-white/20 backdrop-blur-[1px]">
        <ExposureStage inputUrl={inputUrl} finalUrl={finalUrl} />
      </div>

      <p className="absolute left-1/2 top-[699px] -translate-x-1/2 whitespace-nowrap text-[16px] text-bone-2">
        {count} second{count === 1 ? '' : 's'} remaining
      </p>
      <p className="copy absolute left-1/2 top-[729px] w-[297px] -translate-x-1/2 text-center text-[20px] text-bone-2">
        The print is turning Persian blue.
      </p>

      <div className="absolute left-1/2 top-[800px] -translate-x-1/2">
        <AnimatePresence>
          {ready && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <PillButton className="text-[#FFFDF9]" onClick={() => navigate(ROUTES.done)}>
                next
              </PillButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
