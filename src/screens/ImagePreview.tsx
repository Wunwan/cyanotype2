import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import { PillButton } from '../components/PillButton';
import { deletePrint, getPrint, type Print } from '../lib/storage';
import { ROUTES } from '../lib/flow';

const TOP = { rotate: -6, scale: 1, x: 0, y: 0, zIndex: 2 };
const BACK = { rotate: 6, scale: 0.95, x: 16, y: 14, zIndex: 1 };

export default function ImagePreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [print, setPrint] = useState<Print | null>(null);
  // Which print sits on top: the cyanotype or the original photo.
  const [top, setTop] = useState<'final' | 'original'>('final');

  useEffect(() => {
    if (id) setPrint(getPrint(id));
  }, [id]);

  const cards: { key: 'final' | 'original'; src: string }[] = print
    ? [
        { key: 'final', src: print.finalImage },
        { key: 'original', src: print.originalImage },
      ]
    : [];

  const meta = print?.metadata;

  const saveImage = () => {
    if (!print) return;
    const src = top === 'final' ? print.finalImage : print.originalImage;
    const a = document.createElement('a');
    a.href = src;
    a.download = `cyanotype-${meta?.name || print.id}-${top}.png`;
    a.click();
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <header className="absolute right-7 top-[25px] text-right">
          <h1 className="font-serif-display text-[48px] leading-[0.95] text-ink">
            Memory
            <br />
            lane
          </h1>
        </header>

        {/* Save the currently visible image */}
        {print && (
          <div className="absolute right-7 top-[154px]">
            <PillButton onClick={saveImage} aria-label="Save image to device">
              save
            </PillButton>
          </div>
        )}

        {/* Two stacked prints — tap the back one to bring it to the top. */}
        <div className="absolute left-1/2 top-[232px] h-[300px] w-[232px] -translate-x-1/2">
          {cards.map((c) => {
            const isTop = c.key === top;
            return (
              <motion.button
                key={c.key}
                type="button"
                aria-label={
                  c.key === 'final' ? 'Cyanotype print' : 'Original photo'
                }
                className="absolute inset-0 grid place-items-center bg-bone p-2 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.4)]"
                animate={isTop ? TOP : BACK}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                onClick={() => !isTop && setTop(c.key)}
              >
                <img
                  src={c.src}
                  alt=""
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                />
              </motion.button>
            );
          })}
        </div>

        {/* Read-only metadata */}
        <div className="absolute left-1/2 top-[600px] w-[295px] -translate-x-1/2 border border-edge text-black">
          <div className="flex items-baseline gap-2 border-b border-edge px-2.5 py-1.5">
            <span className="text-[11px] font-semibold">name:</span>
            <span className="font-hand text-[16px] font-normal text-ink">{meta?.name || '—'}</span>
          </div>
          <div className="grid grid-cols-2">
            <div className="border-r border-edge px-2.5 py-1.5">
              <div className="text-[11px] font-semibold">date:</div>
              <div className="font-hand text-[16px] font-normal text-ink">{meta?.date || '—'}</div>
            </div>
            <div className="px-2.5 py-1.5">
              <div className="text-[11px] font-semibold">place:</div>
              <div className="font-hand text-[16px] font-normal text-ink">{meta?.place || '—'}</div>
            </div>
          </div>
        </div>

        {!print && (
          <p className="absolute left-1/2 top-[400px] -translate-x-1/2 text-[14px] text-ink/50">
            print not found
          </p>
        )}

        {/* Delete this print */}
        <button
          type="button"
          onClick={() => {
            if (id) deletePrint(id);
            navigate(ROUTES.memory);
          }}
          aria-label="Delete this print"
          className="absolute bottom-[80px] left-7 flex h-[44px] items-center gap-2 rounded-full border border-edge px-5 text-[15px] text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
          </svg>
          delete
        </button>

        {/* Back to the gallery */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.memory)}
          aria-label="Back to memory lane"
          className="absolute bottom-[80px] right-7 flex h-[44px] items-center rounded-full border border-edge px-5"
        >
          <img src="/assets/icon-back.svg" alt="" aria-hidden className="h-6 w-6" />
        </button>
      </div>
    </PaperBackground>
  );
}
