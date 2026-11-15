import type { MediaStore } from "../../ports/media-store";

export function createMemoryMediaStore() {
  const stored: { url: string; bytes: Uint8Array }[] = [];
  return {
    async save(bytes) {
      const url = `memory://media/${stored.length + 1}.jpg`;
      stored.push({ url, bytes });
      return url;
    },
    stored: () => stored,
  } satisfies MediaStore & { stored: unknown };
}
