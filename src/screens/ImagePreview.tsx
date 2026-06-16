import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import { getPrint, type Print } from '../lib/storage';
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
