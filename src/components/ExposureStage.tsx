import { motion } from 'framer-motion';

/**
 * The exposure visual for screen 7. Shows the input image (the negative for
 * full-flow users, the original for express), washes it in Prussian blue over
 * the countdown, then cross-fades to the processed cyanotype once it's ready.
 *
 * This component is intentionally isolated so a teammate can replace the visual
 * treatment (e.g. a real UV-exposure shader) without touching Process flow logic.
 */
export default function ExposureStage({
  inputUrl,
  finalUrl,
}: {
  inputUrl: string | null;
  finalUrl: string | null;
}) {
  return (
    <div className="relative h-[368px] w-[300px] overflow-hidden rounded-[2px] shadow-[0_10px_30px_-16px_rgba(0,0,0,0.6)]">
      {inputUrl && (
        <img
          src={inputUrl}
          alt="Exposing print"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      )}

      {/* Prussian-blue wash building up during exposure. */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: '#0c2540', mixBlendMode: 'multiply' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 4.5, ease: 'easeIn' }}
      />

      {/* Finished cyanotype fades in near the end. */}
      {finalUrl && (
        <motion.img
          src={finalUrl}
          alt="Finished cyanotype"
          className="absolute inset-0 h-full w-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 3 }}
          draggable={false}
        />
      )}
    </div>
  );
}
