import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import Tray from '../components/Tray';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useImageMeta } from '../hooks/useImageMeta';
import { ROUTES, nextRoute, progressStep } from '../lib/flow';

export default function Preview() {
  const navigate = useNavigate();
  const { flowMode, userImage } = useFlow();
  const { url, orientation } = useImageMeta(userImage);
  const trayWidth = orientation === 'portrait' ? 360 : 394;
  const trayTop = orientation === 'portrait' ? 152 : 248;

  return (
    <PaperBackground>
      <div className="relative flex h-full w-full flex-col items-center">
        <ProgressIndicator step={progressStep(ROUTES.preview)} />
        <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
          Make a collage
        </p>

        {/* Tray slides up from below; the photo fades in 200ms later.
            Static wrapper centers; motion child animates only opacity/y so
            Framer's inline transform doesn't fight the centering translate. */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: trayTop }}>
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          >
            <Tray imageUrl={url} orientation={orientation} width={trayWidth} />
            {/* TODO: sticker system */}
          </motion.div>
        </div>

        <p className="copy absolute left-1/2 top-[668px] w-[230px] -translate-x-1/2 text-center text-[16px] text-ink">
          Paste cutouts from your photo gallery and build a composition.{' '}
          <a
            href="https://support.apple.com/en-us/102460"
            target="_blank"
            rel="noopener noreferrer"
            className="text-edge underline"
          >
            Learn how
          </a>
        </p>

        <div className="absolute left-1/2 top-[775px] -translate-x-1/2">
          <PillButton onClick={() => navigate(nextRoute(ROUTES.preview, flowMode)!)}>
            done
          </PillButton>
        </div>
      </div>
    </PaperBackground>
  );
}
