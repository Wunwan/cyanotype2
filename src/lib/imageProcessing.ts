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

const PAPER_COLOR = [252, 251, 246] as const;

/**
 * Lay out 1–5 images in a grid and return a single composited blob. Used
 * before the cyanotype pipeline so multiple uploads are treated as one image.
 */
export async function compositeImages(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) throw new Error('compositeImages: no images');
  if (blobs.length === 1) return blobs[0];

  const imgs = await Promise.all(blobs.map(blobToImage));
  const cols = blobs.length <= 2 ? blobs.length : Math.ceil(Math.sqrt(blobs.length));
  const rows = Math.ceil(blobs.length / cols);
  const CELL = 600;

  const canvas = document.createElement('canvas');
  canvas.width = CELL * cols;
  canvas.height = CELL * rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blobs[0];

  ctx.fillStyle = `rgb(${PAPER_COLOR.join(',')})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  imgs.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = col * CELL;
    const cy = row * CELL;
    const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    let dw = CELL;
    let dh = CELL / aspect;
    if (dh > CELL) { dh = CELL; dw = CELL * aspect; }
    ctx.drawImage(img, cx + (CELL - dw) / 2, cy + (CELL - dh) / 2, dw, dh);
  });

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? blobs[0]), 'image/png'),
  );
}

/**
 * Like processCyanotype but applies a painted mask: only pixels where the mask
 * has paint (alpha > 0) show the cyanotype image; uncoated areas become paper
 * color. The mask edges are preserved exactly as drawn.
 */
export async function processCyanotypeWithMask(
  imageBlob: Blob,
  maskBlob: Blob,
): Promise<Blob> {
  const [img, maskImg] = await Promise.all([blobToImage(imageBlob), blobToImage(maskBlob)]);

  const nw = img.naturalWidth || 800;
  const nh = img.naturalHeight || 800;
  const scale = Math.min(1, 2000 / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return processCyanotype(imageBlob);

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // Negative + cyanotype tone mapping (same as processCyanotype).
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
  mapCyanotype(d, w, h);

  // Sample the mask at the same resolution.
  const mCanvas = document.createElement('canvas');
  mCanvas.width = w;
  mCanvas.height = h;
  const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
  if (!mCtx) {
    ctx.putImageData(imgData, 0, 0);
    return new Promise((resolve) => canvas.toBlob((out) => resolve(out ?? imageBlob), 'image/png'));
  }
  mCtx.drawImage(maskImg, 0, 0, w, h);
  const maskData = mCtx.getImageData(0, 0, w, h).data;

  // Blend cyanotype with paper color proportional to mask alpha so brush
  // stroke opacity and edge softness carry through to the final print.
  for (let i = 0; i < d.length; i += 4) {
    const a = maskData[i + 3] / 255;
    if (a < 1) {
      const inv = 1 - a;
      d[i]     = Math.round(d[i]     * a + PAPER_COLOR[0] * inv);
      d[i + 1] = Math.round(d[i + 1] * a + PAPER_COLOR[1] * inv);
      d[i + 2] = Math.round(d[i + 2] * a + PAPER_COLOR[2] * inv);
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return new Promise((resolve) => canvas.toBlob((out) => resolve(out ?? imageBlob), 'image/png'));
}

/**
 * Downscale an image and return a compressed JPEG data URL. Keeps localStorage
 * usage sane — full-resolution phone photos as base64 quickly blow the ~5MB
 * quota (which silently breaks save + navigation).
 */
export async function downscaleToDataUrl(
  blob: Blob,
  maxDim = 600,
  quality = 0.82,
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
