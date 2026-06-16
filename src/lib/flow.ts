import type { FlowMode } from '../context/FlowContext';

/** Route paths, one per screen. */
export const ROUTES = {
  landing: '/',
  upload: '/upload',
  preview: '/preview',
  negative: '/negative',
  coat: '/coat',
  darkroom: '/darkroom',
  process: '/process',
  done: '/done',
  memory: '/memory',
  imagePreview: '/memory/:id',
} as const;

/** Ordered step sequences. Express skips the storytelling steps (3-6). */
const FULL_ORDER: string[] = [
  ROUTES.upload,
  ROUTES.preview,
  ROUTES.negative,
  ROUTES.coat,
  ROUTES.darkroom,
  ROUTES.process,
  ROUTES.done,
];

const EXPRESS_ORDER: string[] = [ROUTES.upload, ROUTES.process, ROUTES.done];

/** The next route in the flow after `current`, respecting the chosen mode. */
export function nextRoute(current: string, mode: FlowMode): string | null {
  const order = mode === 'express' ? EXPRESS_ORDER : FULL_ORDER;
  const i = order.indexOf(current);
  if (i === -1 || i === order.length - 1) return null;
  return order[i + 1];
}

/** 1-indexed progress step for the top indicator (full mode only). */
export function progressStep(route: string): number {
  const i = FULL_ORDER.indexOf(route);
  return i === -1 ? 1 : i + 1;
}
