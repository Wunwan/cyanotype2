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
    <div className="relative w-full overflow-hidden" style={{ minHeight: inputUrl ? undefined : 240 }}>
      {/* Base image — proportionally scale down if too tall to fit the frame. */}
      {inputUrl && (
        <img
          src={inputUrl}
          alt="Exposing print"
          className="mx-auto block h-auto w-auto max-w-full"
          style={{ maxHeight: 460 }}
          draggable={false}
        />
      )}

      {/* Prussian-blue wash building up during exposure. */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: '#0c2540', mixBlendMode: 'multiply' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 5, ease: 'linear' }}
      />

      {/* Finished cyanotype — matches base image layout exactly. */}
      {finalUrl && (
        <motion.img
          src={finalUrl}
          alt="Finished cyanotype"
          className="absolute inset-0 h-full w-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, delay: 2.5 }}
          draggable={false}
        />
      )}
    </div>
  );
}
