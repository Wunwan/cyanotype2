import { useEffect, useState } from 'react';

/**
 * Like useObjectUrl but for an array of blobs. Returns a parallel array of
 * object URLs that are revoked automatically when blobs change or on unmount.
 * The blobs array reference must be stable (e.g. from a FlowContext useState).
 */
export function useObjectUrls(blobs: Blob[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    if (blobs.length === 0) {
      setUrls([]);
      return;
    }
    const next = blobs.map((b) => URL.createObjectURL(b));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [blobs]);
  return urls;
}
