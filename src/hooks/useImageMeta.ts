import { useEffect, useState } from 'react';
import type { Orientation } from '../components/Tray';

interface ImageMeta {
  url: string | null;
  orientation: Orientation;
  aspect: number; // width / height
}

/** Object URL + natural orientation for a Blob (square counts as portrait). */
export function useImageMeta(blob: Blob | null | undefined): ImageMeta {
  const [meta, setMeta] = useState<ImageMeta>({
    url: null,
    orientation: 'portrait',
    aspect: 1,
  });

  useEffect(() => {
    if (!blob) {
      setMeta({ url: null, orientation: 'portrait', aspect: 1 });
      return;
    }
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight || 1;
      setMeta({ url, orientation: aspect > 1 ? 'landscape' : 'portrait', aspect });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return meta;
}
