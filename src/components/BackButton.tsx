import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ light = false }: { light?: boolean }) {
  const navigate = useNavigate();
  return (
    <motion.button
      type="button"
      aria-label="Go back"
      onClick={() => navigate(-1)}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`absolute left-[14px] top-[32px] flex h-[44px] w-[44px] items-center justify-center ${light ? 'text-bone-2' : 'text-ink'}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M5 12l7-7M5 12l7 7" />
      </svg>
    </motion.button>
  );
}
