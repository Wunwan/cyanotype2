import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import BackButton from '../components/BackButton';
import Tray from '../components/Tray';
import StickerLayer from '../components/StickerLayer';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useImageMeta } from '../hooks/useImageMeta';
import { useObjectUrls } from '../hooks/useObjectUrls';
import { ROUTES, nextRoute, progressStep } from '../lib/flow';

export default function Preview() {
  const navigate = useNavigate();
  const { flowMode, userImages } = useFlow();
  const imageUrls = useObjectUrls(userImages);

  // Use first image to determine tray orientation.
  const { orientation } = useImageMeta(userImages[0] ?? null);
  const trayWidth = orientation === 'portrait' ? 360 : 394;
  const trayTop = orientation === 'portrait' ? 152 : 248;

  const multiOverlay =
    userImages.length > 1 ? <MultiGrid urls={imageUrls} /> : undefined;

  return (
    <PaperBackground>
      <div className="relative flex h-full w-full flex-col items-center">
        <BackButton />
        <ProgressIndicator step={progressStep(ROUTES.preview)} />
        <p className="absolute left-[34px] top-[94px] whitespace-nowrap text-[14px] text-ink">
          Make a collage
        </p>

        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: trayTop }}>
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          >
            <Tray
              imageUrl={userImages.length === 1 ? (imageUrls[0] ?? null) : null}
              orientation={orientation}
              width={trayWidth}
              overlay={multiOverlay}
            />
          </motion.div>
        </div>

        <StickerLayer className="absolute inset-x-0 top-[110px] bottom-[232px]" />

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

function MultiGrid({ urls }: { urls: string[] }) {
  const n = urls.length;
  // Grid template: 2 cols for 2–4, 3 cols for 5
  const cols = n === 5 ? 3 : 2;

  return (
    <div
      className="absolute inset-0 grid gap-0.5 p-0.5"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {urls.map((url, i) => {
        // For 3 images: last image spans both columns
        const spanFull = n === 3 && i === 2;
        return (
          <motion.img
            key={i}
            src={url}
            alt=""
            draggable={false}
            className="h-full w-full object-cover select-none"
            style={{ gridColumn: spanFull ? `span ${cols}` : undefined, WebkitTouchCallout: 'none', userSelect: 'none' }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.08 + 0.2 }}
          />
        );
      })}
    </div>
  );
}
