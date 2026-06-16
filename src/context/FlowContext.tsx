import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PrintMetadata } from '../lib/storage';

export type FlowMode = 'full' | 'express' | null;

interface FlowState {
  flowMode: FlowMode;
  userImage: Blob | null;
  negativeImage: Blob | null;
  paintedMask: Blob | null;
  finalPrint: Blob | null;
  metadata: PrintMetadata;
}

interface FlowContextValue extends FlowState {
  setFlowMode: (mode: FlowMode) => void;
  setUserImage: (blob: Blob | null) => void;
  setNegativeImage: (blob: Blob | null) => void;
  setPaintedMask: (blob: Blob | null) => void;
  setFinalPrint: (blob: Blob | null) => void;
  setMetadata: (meta: PrintMetadata) => void;
  /** Wipe the in-progress print and start over (used by "Make another"). */
  resetFlow: () => void;
}

const emptyMetadata: PrintMetadata = { name: '', place: '', date: '' };

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [flowMode, setFlowMode] = useState<FlowMode>(null);
  const [userImage, setUserImage] = useState<Blob | null>(null);
  const [negativeImage, setNegativeImage] = useState<Blob | null>(null);
  const [paintedMask, setPaintedMask] = useState<Blob | null>(null);
  const [finalPrint, setFinalPrint] = useState<Blob | null>(null);
  const [metadata, setMetadata] = useState<PrintMetadata>(emptyMetadata);

  const value = useMemo<FlowContextValue>(
    () => ({
      flowMode,
      userImage,
      negativeImage,
      paintedMask,
      finalPrint,
      metadata,
      setFlowMode,
      setUserImage,
      setNegativeImage,
      setPaintedMask,
      setFinalPrint,
      setMetadata,
      resetFlow: () => {
        setFlowMode(null);
        setUserImage(null);
        setNegativeImage(null);
        setPaintedMask(null);
        setFinalPrint(null);
        setMetadata(emptyMetadata);
      },
    }),
    [flowMode, userImage, negativeImage, paintedMask, finalPrint, metadata],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within a FlowProvider');
  return ctx;
}
