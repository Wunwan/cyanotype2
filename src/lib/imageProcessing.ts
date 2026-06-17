/**
 * Image processing utilities.
 *
 * `processCyanotype` ports the renderer from JessCai06/Cyanotype: the source
 * photo is inverted to a negative, then mapped to cyanotype tones via perceptual
 * luminance → sigmoid exposure → colour-anchor interpolation, plus paper grain
 * and a radial vignette.
 */

/** Read a Blob into an HTMLImageElement. */
function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// Cyanotype colour anchors [L_exposed, R, G, B] (from JessCai06/Cyanotype).
const ANCHORS: number[][] = [
  [0.0, 10, 36, 64],
  [0.3, 28, 82, 131],
  [0.6, 82, 148, 186],
  [0.85, 168, 208, 220],
  [1.0, 224, 235, 220],
];

/** Map already-inverted (negative) pixel data to cyanotype tones, in place. */
function mapCyanotype(src: Uint8ClampedArray, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const R = src[i];
      const G = src[i + 1];
      const B = src[i + 2];

      // Perceptual luminance, then a sigmoid S-curve exposure simulation.
      const L = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
      const Le = 1 / (1 + Math.exp(-10 * (L - 0.5)));

      // Interpolate between colour anchors.
      let lo = ANCHORS[0];
      let hi = ANCHORS[ANCHORS.length - 1];
      for (let a = 0; a < ANCHORS.length - 1; a++) {
        if (Le >= ANCHORS[a][0] && Le <= ANCHORS[a + 1][0]) {
          lo = ANCHORS[a];
          hi = ANCHORS[a + 1];
          break;
        }
      }
      const span = hi[0] - lo[0];
      const t = span === 0 ? 0 : (Le - lo[0]) / span;
      let cR = lo[1] + t * (hi[1] - lo[1]);
      let cG = lo[2] + t * (hi[2] - lo[2]);
      let cB = lo[3] + t * (hi[3] - lo[3]);

      // Paper grain (±6) and a soft radial vignette (0.35 falloff).
      const noise = (Math.random() - 0.5) * 12;
      const dx = x - cx;
      const dy = y - cy;
      const vignette = 1 - Math.pow(Math.sqrt(dx * dx + dy * dy) / maxDist, 2) * 0.35;
      src[i] = (cR + noise) * vignette;
      src[i + 1] = (cG + noise) * vignette;
      src[i + 2] = (cB + noise) * vignette;
      // alpha (src[i+3]) preserved
    }
  }
}

/**
 * Render a cyanotype print from a source photo: invert to a negative, then map
 * to cyanotype tones. Work is capped at ~1100px on the long edge to keep the
 * CPU pass responsive on large phone photos.
 */
export async function processCyanotype(imageBlob: Blob): Promise<Blob> {
  const img = await blobToImage(imageBlob);
  const nw = img.naturalWidth || 800;
  const nh = img.naturalHeight || 800;
  const scale = Math.min(1, 2000 / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return imageBlob;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  // 1. Negative.
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
  // 2. Cyanotype tone mapping.
  mapCyanotype(d, w, h);
  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((out) => resolve(out ?? imageBlob), 'image/png');
  });
}

/** Produce a fully color-inverted (photographic negative) copy of an image. */
export async function invertImage(imageBlob: Blob): Promise<Blob> {
  const img = await blobToImage(imageBlob);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 800;
  canvas.height = img.naturalHeight || 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageBlob;
  ctx.filter = 'invert(1)';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob((out) => resolve(out ?? imageBlob), 'image/png');
  });
}

/**
 * Downscale an image and return a compressed JPEG data URL. Keeps localStorage
 * usage sane — full-resolution phone photos as base64 quickly blow the ~5MB
 * quota (which silently breaks save + navigation).
 */
export async function downscaleToDataUrl(
  blob: Blob,
  maxDim = 1600,
  quality = 0.9,
): Promise<string> {
  const img = await blobToImage(blob);
  const w = img.naturalWidth || maxDim;
  const h = img.naturalHeight || maxDim;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return blobToDataUrl(blob);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Convert a Blob to a base64 data URL (for localStorage persistence). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Convert a base64 data URL back to a Blob. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
