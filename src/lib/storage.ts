/**
 * localStorage persistence for cyanotype prints.
 * All prints live under a single key as a JSON array. Image blobs are stored
 * as base64 data URLs (heavy on quota, acceptable for the prototype).
 */

export interface PrintMetadata {
  name: string;
  place: string;
  date: string;
}

export interface PrintPosition {
  x: number;
  y: number;
  rotation: number;
}

export interface Print {
  id: string; // `print_${Date.now()}`
  originalImage: string; // base64 data URL of the user's uploaded photo
  finalImage: string; // base64 data URL of the cyanotype result
  metadata: PrintMetadata;
  position?: PrintPosition;
  createdAt: number;
}

const STORAGE_KEY = 'cyanotype2:prints';

function readAll(): Print[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Print[]) : [];
  } catch (err) {
    console.warn('[storage] failed to read prints', err);
    return [];
  }
}

function writeAll(prints: Print[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prints));
  } catch (err) {
    // Most likely a quota error from large base64 images.
    console.error('[storage] failed to write prints (quota?)', err);
    throw err;
  }
}

export function savePrint(print: Print): void {
  const prints = readAll();
  const idx = prints.findIndex((p) => p.id === print.id);
  if (idx >= 0) prints[idx] = print;
  else prints.push(print);
  writeAll(prints);
}

export function getAllPrints(): Print[] {
  // Newest first.
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getPrint(id: string): Print | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function updatePrintPosition(id: string, position: Print['position']): void {
  const prints = readAll();
  const print = prints.find((p) => p.id === id);
  if (!print) return;
  print.position = position;
  writeAll(prints);
}

export function updatePrintMetadata(id: string, metadata: Print['metadata']): void {
  const prints = readAll();
  const print = prints.find((p) => p.id === id);
  if (!print) return;
  print.metadata = metadata;
  writeAll(prints);
}

export function deletePrint(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id));
}
