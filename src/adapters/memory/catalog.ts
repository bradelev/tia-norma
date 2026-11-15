import type { Catalog, Draft, Piece } from "../../ports/catalog";

export function createMemoryCatalog(): Catalog {
  let draft: Draft | null = null;
  const pieces: Piece[] = [];
  const byPreview = new Map<string, Piece>();

  return {
    async draft() {
      return draft;
    },
    async saveDraft(next) {
      draft = next;
    },
    async publish(previewId, data) {
      const already = byPreview.get(previewId);
      if (already) return already;
      const piece = { number: pieces.length + 1, ...data };
      pieces.push(piece);
      byPreview.set(previewId, piece);
      draft = null;
      return piece;
    },
    async publishedFrom(previewId) {
      return byPreview.get(previewId) ?? null;
    },
    async published() {
      return [...pieces].reverse();
    },
  };
}
