import type { MediaStore } from "../../ports/media-store";

export function createMemoryMediaStore(): MediaStore {
  let count = 0;
  return {
    async save() {
      count += 1;
      return `memory://media/${count}.jpg`;
    },
  };
}
