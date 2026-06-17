import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PaperBackground from '../components/PaperBackground';
import Decoration from '../components/Decoration';
import { PillButton, TextLink } from '../components/PillButton';
import { useFlow } from '../context/FlowContext';
import { DARK_GRADIENT } from '../lib/theme';
import { ROUTES } from '../lib/flow';

// Decorations spring in one at a time (~150ms stagger), each from a different
// direction, then the CTAs fade in last. Coordinates are exact Figma values
// (node 870:890), so the composition matches the design 1:1.
const DECOS = [
  // small vintage photo, clipped to the card's left edge — flies in from the left
  { key: 'photo', src: '/assets/photo-image124.png', left: 23, top: 389, width: 101, height: 101, rotate: 0, from: { x: -190 }, delay: 0.35, idle: 'float' as const, idleAmount: 3, idleDuration: 5.5 },
  // silver button resting on the print — drops from the top
  { key: 'button', src: '/assets/button-image143.png', left: 220, top: 226, width: 100, height: 112, rotate: 0, from: { y: -240 }, delay: 0.5, idle: 'rotate' as const, idleAmount: 2, idleDuration: 4.5 },
  // pushpin / thumbtack — arrives from the upper right
  { key: 'pushpin', src: '/assets/pushpin-image122.png', left: 286, top: 367, width: 67, height: 73, rotate: -5.71, from: { x: 150, y: -90 }, delay: 0.65, idle: 'rotate' as const, idleAmount: 2.5, idleDuration: 5 },
  // postage stamp — swings up from the lower right
  { key: 'stamp', src: '/assets/stamp-image123.png', left: 264, top: 464, width: 131, height: 130, rotate: 0, from: { x: 150, y: 80 }, delay: 0.8, idle: 'rotate' as const, idleAmount: 1.5, idleDuration: 6 },
  // paperclip — clings to the far-left edge, drifts in from the bottom-left
  { key: 'clip', src: '/assets/paperclip-image119.png', left: -16, top: 440, width: 129, height: 119, rotate: 37.23, from: { x: -120, y: 150, rotate: -20 }, delay: 0.95, idle: 'float' as const, idleAmount: 3, idleDuration: 5 },
];

const CTA_DELAY = 1.45; // after the last decoration (0.95) has settled

export default function Landing() {
  const navigate = useNavigate();
  const { setFlowMode } = useFlow();

  const start = (mode: 'full' | 'express') => {
    setFlowMode(mode);
    navigate(ROUTES.upload);
  };

  return (
    <PaperBackground>
      <div className="relative h-full w-full">
        {/* Logo placeholder (Figma node 870:900 — swap for the real mark). */}
        <div className="absolute left-7 top-[35px] grid h-[31px] w-[53px] place-items-center rounded-[2px] bg-black/5 text-[12px] text-ink/40">
          logo
        </div>

        {/* Header — "Cyanotype" is one of the four display-serif headers. */}
        <motion.header
          className="absolute left-[41px] top-[141px] w-[304px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.1 }}
        >
          <h1 className="font-serif-display text-[36px] leading-none text-ink">
            Cyanotype
          </h1>
          <p className="copy mt-4 text-[14px] text-ink">
            an 180-year-old photographic printing process known for its striking
            Prussian-blue prints.
          </p>
        </motion.header>

        {/* Hero print — the tilted Prussian-blue card the decorations sit on. */}
        <motion.div
          className="absolute left-[37px] top-[280px] h-[368px] w-[328px] rounded-[3px]"
          style={{ backgroundImage: DARK_GRADIENT }}
          initial={{ opacity: 0, scale: 0.9, rotate: -4.42 }}
          animate={{ opacity: 1, scale: 1, rotate: -4.42 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.2 }}
        />

        {/* Decorations — staggered spring entrances + idle drift. */}
        {DECOS.map((d) => (
          <Decoration
            key={d.key}
            src={d.src}
            left={d.left}
            top={d.top}
            width={d.width}
            height={d.height}
            rotate={d.rotate}
            from={d.from}
            delay={d.delay}
            idle={d.idle}
            idleAmount={d.idleAmount}
            idleDuration={d.idleDuration}
            zIndex={20}
          />
        ))}

        {/* CTAs animate in last, after the decorations settle. The static
            wrapper handles centering; the motion child only animates opacity/y
            (Framer's inline transform would otherwise clobber a Tailwind
            -translate-x-1/2 and push the group off-center). */}
        <div className="absolute left-1/2 top-[697px] w-[168px] -translate-x-1/2" style={{ zIndex: 30 }}>
          <motion.div
            className="flex flex-col items-center gap-[27px]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26, delay: CTA_DELAY }}
          >
            <PillButton className="w-full" onClick={() => start('full')}>
              <span className="whitespace-pre text-center leading-snug">
                {'Take me through\nthe process'}
              </span>
            </PillButton>
            <TextLink onClick={() => start('express')}>I know how to make it</TextLink>
          </motion.div>
        </div>
      </div>
    </PaperBackground>
  );
}
