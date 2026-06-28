import { useRef, useState } from 'react';

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
}

/**
 * An overlay for the preview/collage screen. Press-and-hold anywhere to bring
 * up a "Paste" action, which reads a cut-out image from the clipboard and drops
 * it as a draggable sticker. Stickers can be repositioned and removed. Drag is
 * scale-aware so it tracks the finger inside the scaled phone frame.
 */
export default function StickerLayer({ className = '' }: { className?: string }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [hint, setHint] = useState('');
  const press = useRef<{ t: number; x: number; y: number; timer: number } | null>(null);
  const drag = useRef<{ id: string; sx: number; sy: number; bx: number; by: number; scale: number; moved: boolean } | null>(null);

  // Local coordinates within the layer, corrected for the phone-frame scale.
  const localPoint = (e: React.PointerEvent) => {
    const r = layerRef.current!.getBoundingClientRect();
    const scale = r.width / layerRef.current!.offsetWidth || 1;
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale, scale };
  };

  // ── press-and-hold on empty space → Paste menu ──
  const onLayerPointerDown = (e: React.PointerEvent) => {
    if (e.target !== layerRef.current) return; // ignore presses on a sticker
    setMenu(null);
    const p = localPoint(e);
    const timer = window.setTimeout(() => {
      setMenu({ x: p.x, y: p.y });
      press.current = null;
    }, 450);
    press.current = { t: Date.now(), x: e.clientX, y: e.clientY, timer };
  };
  const cancelPress = (e?: React.PointerEvent) => {
    if (!press.current) return;
    if (e && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) < 8) {
      // treat as a tap — leave menu closed
    }
    clearTimeout(press.current.timer);
    press.current = null;
  };

  const paste = async () => {
    const at = menu;
    setMenu(null);
    if (!at) return;
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          const url = URL.createObjectURL(blob);
          setStickers((s) => [...s, { id: `st_${Date.now()}`, url, x: at.x, y: at.y }]);
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

  // ── dragging a sticker ──
  const onStickerDown = (e: React.PointerEvent, st: Sticker) => {
    e.stopPropagation();
    const p = localPoint(e);
    drag.current = { id: st.id, sx: e.clientX, sy: e.clientY, bx: st.x, by: st.y, scale: p.scale, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onStickerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / d.scale;
    const dy = (e.clientY - d.sy) / d.scale;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setStickers((s) => s.map((x) => (x.id === d.id ? { ...x, x: d.bx + dx, y: d.by + dy } : x)));
  };
  const onStickerUp = () => {
    drag.current = null;
  };

  const remove = (id: string) =>
    setStickers((s) => s.filter((x) => x.id !== id));

  return (
    <div
      ref={layerRef}
      className={`touch-none select-none ${className}`}
      style={{ WebkitTouchCallout: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={onLayerPointerDown}
      onPointerMove={onStickerMove}
      onPointerUp={(e) => {
        cancelPress(e);
        onStickerUp();
      }}
      onPointerLeave={() => {
        cancelPress();
        onStickerUp();
      }}
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
            onClick={() => remove(st.id)}
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-[13px] leading-none text-bone shadow"
          >
            ×
          </button>
        </div>
      ))}

      {menu && (
        <button
          type="button"
          onClick={paste}
          className="absolute z-10 -translate-x-1/2 rounded-[10px] border border-edge bg-bone px-4 py-2 text-[14px] text-ink shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]"
          style={{ left: menu.x, top: menu.y }}
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
