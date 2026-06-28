import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import { PillButton } from '../components/PillButton';
import { deletePrint, getPrint, type Print } from '../lib/storage';
import { ROUTES } from '../lib/flow';

const TOP = { rotate: -6, scale: 1, x: 0, y: 0 };
const BACK = { rotate: 6, scale: 0.95, x: 16, y: 14 };

export default function ImagePreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [print, setPrint] = useState<Print | null>(null);
  const [top, setTop] = useState<'final' | 'original'>('final');

  useEffect(() => {
    if (id) setPrint(getPrint(id));
  }, [id]);

  const meta = print?.metadata;

  const saveImage = () => {
    if (!print) return;
    const src = top === 'final' ? print.finalImage : print.originalImage;
    const a = document.createElement('a');
    a.href = src;
    a.download = `cyanotype-${meta?.name || print.id}${top === 'original' ? '-original' : ''}.png`;
    a.click();
  };

  return (
    <PaperBackground>
      <div className="flex h-full w-full flex-col">

        {/* Top bar: logo + save left/right, Memory Lane title below */}
        <div className="flex shrink-0 flex-col px-7 pt-[25px]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(ROUTES.landing)}
              aria-label="Go to home"
              className="grid h-[31px] w-[53px] place-items-center rounded-[2px] bg-black/5 text-[12px] text-ink/40"
            >
              logo
            </button>
            {print && (
              <PillButton onClick={saveImage} aria-label="Save image to device">
                save
              </PillButton>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => navigate(ROUTES.memory)}
              aria-label="Back to Memory Lane"
              className="text-right"
            >
              <h1 className="font-serif-display text-[48px] leading-[0.95] text-ink">
                Memory
                <br />
                lane
              </h1>
            </button>
          </div>
        </div>

        {/* Center: image + metadata — overflow-visible so rotated print edges aren't clipped */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
          {/* Two stacked prints — final in flow sets height; original overlays absolutely */}
          {print && (
            <div className="relative w-[294px]">
              <motion.button
                type="button"
                aria-label="Cyanotype print"
                className="relative block w-full bg-white p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                style={{ zIndex: top === 'final' ? 2 : 1 }}
                animate={top === 'final' ? TOP : BACK}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                onClick={() => top !== 'final' && setTop('final')}
              >
                <img src={print.finalImage} alt="" draggable={false} className="block w-full" />
              </motion.button>
              <motion.button
                type="button"
                aria-label="Original photo"
                className="absolute inset-0 block w-full bg-white p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                style={{ zIndex: top === 'original' ? 2 : 1 }}
                animate={top === 'original' ? TOP : BACK}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                onClick={() => top !== 'original' && setTop('original')}
              >
                <img src={print.originalImage} alt="" draggable={false} className="block w-full" />
              </motion.button>
            </div>
          )}

          {/* Read-only metadata */}
          {print && (
            <div className="w-[295px] border border-edge text-black">
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
          )}

          {!print && (
            <p className="text-[14px] text-ink/50">print not found</p>
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex shrink-0 items-center justify-between px-7 pb-[80px]">
          <button
            type="button"
            onClick={() => { if (id) deletePrint(id); navigate(ROUTES.memory); }}
            aria-label="Delete this print"
            className="flex h-[44px] items-center gap-2 rounded-full border border-edge px-5 text-[15px] text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
            </svg>
            delete
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.memory)}
            aria-label="Back to memory lane"
            className="flex h-[44px] items-center rounded-full border border-edge px-5"
          >
            <img src="/assets/icon-back.svg" alt="" aria-hidden className="h-6 w-6" />
          </button>
        </div>

      </div>
    </PaperBackground>
  );
}
