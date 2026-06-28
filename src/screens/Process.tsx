import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExposureStage from '../components/ExposureStage';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import BackButton from '../components/BackButton';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { processCyanotype, processCyanotypeWithMask } from '../lib/imageProcessing';
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
    <PaperBackground className="relative">
      <BackButton />
      {flowMode === 'full' && <ProgressIndicator step={progressStep(ROUTES.process)} />}

      <div className="flex h-full w-full flex-col">
        {/* Top label */}
        <div className="shrink-0 pl-[34px] pt-[94px]">
          <p className="whitespace-nowrap text-[14px] text-ink">One last rinse</p>
        </div>

        {/* Center: exposing print in white frame */}
        <div className="flex flex-1 items-center justify-center overflow-hidden py-6">
          <div className="w-[294px] bg-white p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
            <ExposureStage inputUrl={inputUrl} finalUrl={finalUrl} />
          </div>
        </div>

        {/* Bottom: countdown + copy + next */}
        <div className="flex shrink-0 flex-col items-center gap-2 pb-[60px]">
          <p className="whitespace-nowrap text-[16px] text-ink">
            {ready ? 'Ready!' : `${count} second${count === 1 ? '' : 's'} remaining`}
          </p>
          <p className="copy w-[297px] text-center text-[20px] text-ink">
            The print is turning Persian blue.
          </p>
          <div className="mt-4 h-[44px]">
            <AnimatePresence>
              {ready && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                >
                  <PillButton onClick={() => navigate(ROUTES.done)}>next</PillButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PaperBackground>
  );
}
