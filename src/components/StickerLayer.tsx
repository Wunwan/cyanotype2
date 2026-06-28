import { useRef, useState } from 'react';

export interface Sticker {
  id: string;
  url: string;
  x: number; // center-x in StickerLayer coordinate space
  y: number; // center-y in StickerLayer coordinate space
}

/**
 * Sticker state lives in the parent (Preview) so it can composite the
 * stickers onto the image before navigating away.
 */
export default function StickerLayer({
  className = '',
  stickers,
  onStickersChange,
}: {
  className?: string;
  stickers: Sticker[];
  onStickersChange: (s: Sticker[]) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [hint, setHint] = useState('');
  const press = useRef<{ t: number; x: number; y: number; timer: number } | null>(null);
  const drag = useRef<{ id: string; sx: number; sy: number; bx: number; by: number; scale: number } | null>(null);

  const localPoint = (e: React.PointerEvent) => {
    const r = layerRef.current!.getBoundingClientRect();
    const scale = r.width / layerRef.current!.offsetWidth || 1;
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale, scale };
  };

  const onLayerPointerDown = (e: React.PointerEvent) => {
    if (e.target !== layerRef.current) return;
    setMenuPos(null);
    const p = localPoint(e);
    const timer = window.setTimeout(() => {
      setMenuPos({ x: p.x, y: p.y });
      press.current = null;
    }, 450);
    press.current = { t: Date.now(), x: e.clientX, y: e.clientY, timer };
  };

  const cancelPress = () => {
    if (!press.current) return;
    clearTimeout(press.current.timer);
    press.current = null;
  };

  const paste = async () => {
    const at = menuPos;
    setMenuPos(null);
    if (!at) return;
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          const url = URL.createObjectURL(blob);
          onStickersChange([...stickers, { id: `st_${Date.now()}`, url, x: at.x, y: at.y }]);
          return;
        }
      }
      flash('Copy an image first, then paste');
    } catch {
      flash('Clipboard access was blocked');
    }
  };

  const flash = (msg: string) => {
    setHint(msg);
    window.setTimeout(() => setHint(''), 2200);
  };

  const onStickerDown = (e: React.PointerEvent, st: Sticker) => {
    e.stopPropagation();
    const p = localPoint(e);
    drag.current = { id: st.id, sx: e.clientX, sy: e.clientY, bx: st.x, by: st.y, scale: p.scale };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onStickerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / d.scale;
    const dy = (e.clientY - d.sy) / d.scale;
    onStickersChange(stickers.map((x) => (x.id === d.id ? { ...x, x: d.bx + dx, y: d.by + dy } : x)));
  };

  const onStickerUp = () => { drag.current = null; };

  return (
    <div
      ref={layerRef}
      className={`touch-none select-none ${className}`}
      style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={onLayerPointerDown}
      onPointerMove={onStickerMove}
      onPointerUp={(e) => { cancelPress(); onStickerUp(); void e; }}
      onPointerLeave={() => { cancelPress(); onStickerUp(); }}
    >
      {stickers.map((st) => (
        <div
          key={st.id}
          className="group absolute"
          style={{ left: st.x, top: st.y, transform: 'translate(-50%, -50%)' }}
        >
          <img
            src={st.url}
            alt="sticker"
            draggable={false}
            onPointerDown={(e) => onStickerDown(e, st)}
            className="block w-[120px] max-w-none cursor-grab touch-none select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)] active:cursor-grabbing"
          />
          <button
            type="button"
            aria-label="Remove sticker"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onStickersChange(stickers.filter((x) => x.id !== st.id))}
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-[13px] leading-none text-bone shadow"
          >
            ×
          </button>
        </div>
      ))}

      {menuPos && (
        <button
          type="button"
          onClick={paste}
          className="absolute z-10 -translate-x-1/2 rounded-[10px] border border-edge bg-bone px-4 py-2 text-[14px] text-ink shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          Paste
        </button>
      )}

      {hint && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/85 px-3 py-1.5 text-[12px] text-bone">
          {hint}
        </div>
      )}
    </div>
  );
}
