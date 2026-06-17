import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import MemoryThumb from '../components/MemoryThumb';
import { useFlow } from '../context/FlowContext';
import {
  getAllPrints,
  updatePrintPosition,
  type Print,
  type PrintPosition,
} from '../lib/storage';
import { ROUTES } from '../lib/flow';

// Scatter bounds (relative to the scatter container's top-left).
const THUMB_W = 116;
const THUMB_H = 150;
const randomPos = (): PrintPosition => ({
  x: 12 + Math.random() * (402 - THUMB_W - 24),
  y: 12 + Math.random() * (660 - THUMB_H - 24),
  rotation: (Math.random() - 0.5) * 16, // ±8°
});

// Dotted-grid paper backing (CSS instead of hundreds of dot nodes).
const DOTTED: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(143,185,199,0.5) 1.2px, transparent 1.3px)',
  backgroundSize: '46px 46px',
  backgroundPosition: '14px 8px',
};

export default function Memory() {
  const navigate = useNavigate();
  const { resetFlow } = useFlow();
  const [prints, setPrints] = useState<Print[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load prints and assign+persist a scatter position to any that lack one.
  useEffect(() => {
    const all = getAllPrints().map((p) => {
      if (p.position) return p;
      const position = randomPos();
      updatePrintPosition(p.id, position);
      return { ...p, position };
    });
    setPrints(all);
  }, []);

  const addNew = () => {
    resetFlow();
    navigate(ROUTES.landing);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <div className="absolute left-7 top-[35px] grid h-[31px] w-[53px] place-items-center rounded-[2px] bg-black/5 text-[12px] text-ink/40">
          logo
        </div>

        <header className="absolute right-7 top-[25px] text-right">
          <h1 className="font-serif-display text-[48px] leading-[0.95] text-ink">
            Memory
            <br />
            lane
          </h1>
        </header>

        {/* + : start another print */}
        <button
          type="button"
          onClick={addNew}
          aria-label="Make another print"
          className="absolute left-7 top-[106px] grid h-[44px] w-[44px] place-items-center rounded-full border border-edge"
        >
          <img src="/assets/icon-plus.svg" alt="" aria-hidden className="h-5 w-5" />
        </button>

        {/* Dotted grid + scattered, draggable prints */}
        <div
          ref={containerRef}
          className="absolute inset-x-0 bottom-0 top-[170px] overflow-hidden"
          style={DOTTED}
        >
          {prints.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <img
                src="/assets/paperclip-image119.png"
                alt=""
                aria-hidden
                className="w-[70px] -rotate-12 opacity-60"
              />
              <p className="copy text-[16px] text-ink/60">Your prints will appear here</p>
            </div>
          ) : (
            prints.map((p) => (
              <MemoryThumb
                key={p.id}
                print={p}
                containerRef={containerRef}
                onOpen={(id) => navigate(`/memory/${id}`)}
                onCommit={updatePrintPosition}
              />
            ))
          )}
        </div>
      </div>
    </PaperBackground>
  );
}
