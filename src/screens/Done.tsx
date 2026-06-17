import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditableField from '../components/EditableField';
import { PillButton, TextLink } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { downscaleToDataUrl } from '../lib/imageProcessing';
import { savePrint, type PrintMetadata } from '../lib/storage';
import { ROUTES } from '../lib/flow';

export default function Done() {
  const navigate = useNavigate();
  const { finalPrint, userImage, metadata, setMetadata, resetFlow } = useFlow();
  const url = useObjectUrl(finalPrint ?? userImage);

  const idRef = useRef(`print_${Date.now()}`);
  const createdRef = useRef(Date.now());
  // Cache the (downscaled) data URLs so re-saving on metadata edits is cheap.
  const imagesRef = useRef<{ originalImage: string; finalImage: string } | null>(null);
  const [saved, setSaved] = useState(false);

  // Returns false if saving failed (e.g. localStorage quota) so callers can
  // continue (navigation) instead of being blocked by a thrown error.
  const persist = async (meta: PrintMetadata): Promise<boolean> => {
    const source = finalPrint ?? userImage;
    if (!source) return false;
    try {
      if (!imagesRef.current) {
        const finalImage = await downscaleToDataUrl(source);
        const originalImage = userImage ? await downscaleToDataUrl(userImage) : finalImage;
        imagesRef.current = { originalImage, finalImage };
      }
      savePrint({
        id: idRef.current,
        ...imagesRef.current,
        metadata: meta,
        createdAt: createdRef.current,
      });
      return true;
    } catch (err) {
      console.error('[Done] failed to save print', err);
      return false;
    }
  };

  // Download the finished cyanotype as a PNG file.
  const downloadPrint = () => {
    const blob = finalPrint ?? userImage;
    if (!blob) return;
    const slug = (metadata.name || 'cyanotype')
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'cyanotype';
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const onSave = async () => {
    const ok = await persist(metadata); // keep it in the gallery
    setSaved(ok);
    downloadPrint(); // and download the file
  };

  // Commit a single metadata field; if the print is already saved, keep storage in sync.
  const commitField = (key: keyof PrintMetadata) => (next: string) => {
    const updated = { ...metadata, [key]: next };
    setMetadata(updated);
    if (saved) persist(updated);
  };

  const goMemory = async () => {
    if (!saved) await persist(metadata); // make sure the print lands in the gallery (best-effort)
    navigate(ROUTES.memory);
  };

  const makeAnother = () => {
    resetFlow();
    navigate(ROUTES.landing);
  };

  return (
    <div className="paper-bg relative min-h-full w-full">
      <div className="relative flex flex-col items-center px-7 pb-20">
        {/* First viewport: image, metadata and actions, vertically centered.
            The closing note is pushed below the fold (only appears on scroll). */}
        <div className="flex min-h-[874px] w-full flex-col items-center justify-center py-8">
        {/* Logo + caption + save */}
        <div className="grid h-[31px] w-[53px] place-items-center self-start rounded-[2px] bg-black/5 text-[12px] text-ink/40">
          logo
        </div>

        <div className="mt-8 flex w-full items-start justify-between">
          <p className="copy text-[16px] text-ink">
            bathed in the sun,
            <br />
            vibrant in Persian blue.
          </p>
          <PillButton onClick={onSave} aria-label="Save print to memory lane">
            {saved ? 'saved ✓' : 'save'}
          </PillButton>
        </div>

        {/* The finished print */}
        <div className="mt-6 w-[294px] bg-[#d9d9d9]/30 p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
          {url ? (
            <img src={url} alt="Your finished cyanotype" className="block w-full" />
          ) : (
            <div className="grid h-[360px] place-items-center text-[14px] text-ink/40">
              your print
            </div>
          )}
        </div>

        {/* Click-to-edit metadata */}
        <div className="mt-7 w-[295px] border border-edge text-black">
          <div className="flex items-baseline gap-2 border-b border-edge px-2.5 py-1.5">
            <span className="text-[11px] font-semibold">name:</span>
            <div className="flex-1">
              <EditableField
                value={metadata.name}
                onCommit={commitField('name')}
                ariaLabel="Name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="border-r border-edge px-2.5 py-1.5">
              <div className="text-[11px] font-semibold">date:</div>
              <EditableField
                value={metadata.date}
                onCommit={commitField('date')}
                ariaLabel="Date"
              />
            </div>
            <div className="px-2.5 py-1.5">
              <div className="text-[11px] font-semibold">place:</div>
              <EditableField
                value={metadata.place}
                onCommit={commitField('place')}
                ariaLabel="Place"
              />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-9 flex flex-col items-center gap-6">
          <PillButton className="w-[137px]" onClick={goMemory}>
            Memory lane
          </PillButton>
          <TextLink onClick={makeAnother}>Make another</TextLink>
        </div>
        </div>
        {/* ── below the fold ── */}

        {/* Closing note */}
        <p className="copy mt-16 w-[266px] text-center text-[14px] text-ink">
          We love seeing people discover the slow, analog process of cyanotype
          printing—made more accessible through technology, without losing its magic.
        </p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        >
          <h2 className="font-serif-display text-[48px] leading-none text-ink">Thank you</h2>
          <p className="text-[10px] text-ink">with care, 文宛 (wén wǎn)</p>
        </motion.div>

        <img
          src="/assets/star-image126.png"
          alt=""
          aria-hidden
          className="mt-4 w-[114px]"
        />
      </div>
    </div>
  );
}
