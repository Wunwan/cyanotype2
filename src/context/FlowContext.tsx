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
  userImages: Blob[];       // individual uploads (1–5)
  userImage: Blob | null;   // composite of all userImages (set by Negative screen)
  negativeImage: Blob | null;
  paintedMask: Blob | null;
  finalPrint: Blob | null;
  metadata: PrintMetadata;
}

interface FlowContextValue extends FlowState {
  setFlowMode: (mode: FlowMode) => void;
  setUserImages: (blobs: Blob[]) => void;
  setUserImage: (blob: Blob | null) => void;
  setNegativeImage: (blob: Blob | null) => void;
  setPaintedMask: (blob: Blob | null) => void;
  setFinalPrint: (blob: Blob | null) => void;
  setMetadata: (meta: PrintMetadata) => void;
  resetFlow: () => void;
}

const emptyMetadata: PrintMetadata = { name: '', place: '', date: '' };

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [flowMode, setFlowMode] = useState<FlowMode>(null);
  const [userImages, setUserImages] = useState<Blob[]>([]);
  const [userImage, setUserImage] = useState<Blob | null>(null);
  const [negativeImage, setNegativeImage] = useState<Blob | null>(null);
  const [paintedMask, setPaintedMask] = useState<Blob | null>(null);
  const [finalPrint, setFinalPrint] = useState<Blob | null>(null);
  const [metadata, setMetadata] = useState<PrintMetadata>(emptyMetadata);

  const value = useMemo<FlowContextValue>(
    () => ({
      flowMode,
      userImages,
      userImage,
      negativeImage,
      paintedMask,
      finalPrint,
      metadata,
      setFlowMode,
      setUserImages,
      setUserImage,
      setNegativeImage,
      setPaintedMask,
      setFinalPrint,
      setMetadata,
      resetFlow: () => {
        setFlowMode(null);
        setUserImages([]);
        setUserImage(null);
        setNegativeImage(null);
        setPaintedMask(null);
        setFinalPrint(null);
        setMetadata(emptyMetadata);
      },
    }),
    [flowMode, userImages, userImage, negativeImage, paintedMask, finalPrint, metadata],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within a FlowProvider');
  return ctx;
}
