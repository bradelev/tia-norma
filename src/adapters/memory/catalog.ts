import type { Catalog, Draft, Piece } from "../../ports/catalog";

export function createMemoryCatalog(): Catalog {
  let draft: Draft | null = null;
  const pieces: Piece[] = [];

  return {
    async draft() {
      return draft;
    },
    async saveDraft(next) {
      draft = next;
    },
    async publish(_previewId, data) {
      const piece = { number: pieces.length + 1, ...data };
      pieces.push(piece);
      draft = null;
      return piece;
    },
    async published() {
      return [...pieces];
    },
  };
}
