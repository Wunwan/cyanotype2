import { motion } from 'framer-motion';

/**
 * Thin clothesline-style progress track shown at the top of full-mode steps
 * (screens 2-7). Hidden entirely in express mode. The filled segment springs
 * forward as the step advances.
 *
 * Steps are 1-indexed. The Figma flow has 6 narrative steps (upload → rinse).
 */
export const FULL_FLOW_STEPS = 6;

export default function ProgressIndicator({
  step,
  total = FULL_FLOW_STEPS,
}: {
  step: number;
  total?: number;
}) {
  const dots = Array.from({ length: total });
  const fillPct = total > 1 ? ((step - 1) / (total - 1)) * 100 : 0;

  return (
    <div
      className="absolute left-1/2 top-[75px] h-[11px] w-[332px] -translate-x-1/2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      aria-label={`Step ${step} of ${total}`}
    >
      {/* Base track */}
      <div className="absolute left-0 right-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-edge/50" />
      {/* Filled track */}
      <motion.div
        className="absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-ink"
        initial={false}
        animate={{ width: `${fillPct}%` }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      />
      {/* Step nodes */}
      <div className="absolute inset-0 flex items-center justify-between">
        {dots.map((_, i) => {
          const done = i < step - 1;
          const current = i === step - 1;
          return (
            <span key={i} className="relative grid place-items-center">
              {current && (
                <motion.span
                  layoutId="progress-current-ring"
                  className="absolute h-[11px] w-[11px] rounded-full border border-ink"
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                />
              )}
              <span
                className={`block rounded-full ${
                  done || current
                    ? 'h-[5px] w-[5px] bg-ink'
                    : 'h-[5px] w-[5px] border border-edge bg-cream'
                }`}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
