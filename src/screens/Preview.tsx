import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import ProgressIndicator from '../components/ProgressIndicator';
import BackButton from '../components/BackButton';
import Tray, { TRAY_ASPECT, TRAY_INNER } from '../components/Tray';
import StickerLayer, { type Sticker } from '../components/StickerLayer';
import { PillButton } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useImageMeta } from '../hooks/useImageMeta';
import { useObjectUrls } from '../hooks/useObjectUrls';
import { ROUTES, nextRoute, progressStep } from '../lib/flow';

/** Width of the tray in logical px (402×874 space). */
const TRAY_W = { portrait: 360, landscape: 394 } as const;
/** Top offset of the tray. */
const TRAY_TOP = { portrait: 152, landscape: 248 } as const;
/** Sticker layer top offset (matches absolute top-[110px] class). */
const LAYER_TOP = 110;
/** Render scale for the exported canvas (higher = sharper output). */
const RENDER_SCALE = 3;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function Preview() {
  const navigate = useNavigate();
  const { flowMode, userImages, setUserImages, setUserImage } = useFlow();
  const imageUrls = useObjectUrls(userImages);
  const [stickers, setStickers] = useState<Sticker[]>([]);

  const { orientation } = useImageMeta(userImages[0] ?? null);
  const trayWidth = TRAY_W[orientation];
  const trayTop = TRAY_TOP[orientation];
  const trayLeft = (402 - trayWidth) / 2;
  const trayH = orientation === 'portrait' ? trayWidth * TRAY_ASPECT : trayWidth / TRAY_ASPECT;
  const inset = TRAY_INNER[orientation];

  // Inner photo-frame bounds in the 402×874 logical space.
  const frameLeft = trayLeft + trayWidth * inset.x;
  const frameTop = trayTop + trayH * inset.y;
  const frameW = trayWidth * (1 - 2 * inset.x);
  const frameH = trayH * (1 - 2 * inset.y);

  /**
   * Composite the photo(s) + stickers onto an offscreen canvas the size of the
   * inner photo frame. Stickers that extend outside the frame are clipped.
   * Returns a PNG blob, or null if there are no images to draw.
   */
  const captureCollage = async (): Promise<Blob | null> => {
    if (imageUrls.length === 0) return null;

    const cw = Math.round(frameW * RENDER_SCALE);
    const ch = Math.round(frameH * RENDER_SCALE);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // ── Draw base photo(s) ──────────────────────────────────────────────────
    const n = imageUrls.length;
    if (n === 1) {
      // Single image: object-contain inside the frame.
      try {
        const img = await loadImg(imageUrls[0]);
        const s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      } catch { /* skip bad image */ }
    } else {
      // Multi-image grid: object-cover in each cell (mirrors MultiGrid CSS).
      const cols = n === 5 ? 3 : 2;
      const rows = Math.ceil(n / cols);
      const cellW = cw / cols;
      const cellH = ch / rows;

      const imgs = await Promise.allSettled(imageUrls.map(loadImg));
      imgs.forEach((result, i) => {
        if (result.status !== 'fulfilled') return;
        const img = result.value;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const spanCols = n === 3 && i === 2 ? cols : 1;
        const dx = col * cellW;
        const dy = row * cellH;
        const dw = cellW * spanCols;
        const dh = cellH;

        // object-cover crop
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const cellAspect = dw / dh;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgAspect > cellAspect) {
          sw = img.naturalHeight * cellAspect;
          sx = (img.naturalWidth - sw) / 2;
        } else {
          sh = img.naturalWidth / cellAspect;
          sy = (img.naturalHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      });
    }

    // ── Draw stickers (clipped to frame by canvas bounds) ───────────────────
    await Promise.allSettled(
      stickers.map(async (st) => {
        try {
          const img = await loadImg(st.url);
          const stickerW = 120 * RENDER_SCALE;
          const stickerH = (img.naturalHeight / img.naturalWidth) * stickerW;
          // Convert from StickerLayer coords → frame-relative → canvas coords
          const cx = (st.x - frameLeft) * RENDER_SCALE;
          const cy = (st.y + LAYER_TOP - frameTop) * RENDER_SCALE;
          ctx.drawImage(img, cx - stickerW / 2, cy - stickerH / 2, stickerW, stickerH);
        } catch { /* skip bad sticker */ }
      })
    );

    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const onDone = async () => {
    const blob = await captureCollage();
    if (blob) {
      setUserImages([blob]);
      setUserImage(blob);
    }
    navigate(nextRoute(ROUTES.preview, flowMode)!);
  };

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

        <StickerLayer
          className="absolute inset-x-0 top-[110px] bottom-[232px]"
          stickers={stickers}
          onStickersChange={setStickers}
        />

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
          <PillButton onClick={onDone}>done</PillButton>
        </div>
      </div>
    </PaperBackground>
  );
}

function MultiGrid({ urls }: { urls: string[] }) {
  const n = urls.length;
  const cols = n === 5 ? 3 : 2;

  return (
    <div
      className="absolute inset-0 grid gap-0.5 p-0.5"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {urls.map((url, i) => {
        const spanFull = n === 3 && i === 2;
        return (
          <motion.img
            key={i}
            src={url}
            alt=""
            draggable={false}
            className="h-full w-full object-cover select-none"
            style={{
              gridColumn: spanFull ? `span ${cols}` : undefined,
              WebkitTouchCallout: 'none',
              userSelect: 'none',
            } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.08 + 0.2 }}
          />
        );
      })}
    </div>
  );
}
