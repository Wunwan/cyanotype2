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

const THUMB_W = 116;
const THUMB_H = 150;

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
  // Stacking order: each interaction bumps a print's z so the last-touched
  // print stays on top.
  const zCounter = useRef(10);
  const [zMap, setZMap] = useState<Record<string, number>>({});

  // Load prints and assign+persist positions. New prints (no saved position) land
  // in the center at the top layer; existing prints keep their saved positions.
  useEffect(() => {
    // Sort oldest-first so the newest print ends up with the highest z.
    const allRaw = getAllPrints().sort((a, b) => a.createdAt - b.createdAt);
    const initialZ: Record<string, number> = {};

    // Scatter container is inset-x-0 top-[170px] bottom-0 → 402×704 px.
    const CENTER_X = (402 - THUMB_W) / 2;
    const CENTER_Y = (704 - THUMB_H) / 2;

    const all = allRaw.map((p) => {
      if (p.position) return p;
      const position: PrintPosition = {
        x: CENTER_X,
        y: CENTER_Y,
        rotation: (Math.random() - 0.5) * 6,
      };
      updatePrintPosition(p.id, position);
      initialZ[p.id] = ++zCounter.current;
      return { ...p, position };
    });

    if (Object.keys(initialZ).length > 0) setZMap(initialZ);
    setPrints(all);
  }, []);

  const addNew = () => {
    resetFlow();
    navigate(ROUTES.landing);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        <button
          type="button"
          onClick={() => navigate(ROUTES.landing)}
          aria-label="Go to home"
          className="absolute left-7 top-[35px]"
        >
          <img src="/assets/logo.png" alt="Cyanotype" className="h-[60px] w-[33px] object-contain" draggable={false} />
        </button>

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
                src="/assets/paperclip-image119.webp"
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
                z={zMap[p.id] ?? 1}
                onInteract={() =>
                  setZMap((m) => ({ ...m, [p.id]: ++zCounter.current }))
                }
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
