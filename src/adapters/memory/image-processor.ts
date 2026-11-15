import type { ImageProcessor } from "../../ports/image-processor";

/** Bytes the double rejects, so a conversation can send a bad photo. */
export const BLURRY_PHOTO = new Uint8Array([0xb1]);
export const DARK_PHOTO = new Uint8Array([0xda]);

const same = (a: Uint8Array, b: Uint8Array) => a.join() === b.join();

export function createMemoryImageProcessor(): ImageProcessor {
  return {
    async treat(photo) {
      if (same(photo, BLURRY_PHOTO)) return { problem: "blurry" };
      if (same(photo, DARK_PHOTO)) return { problem: "dark" };
      return { treated: Uint8Array.of(...photo, 0) };
    },
  };
}
