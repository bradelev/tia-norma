import type { Action, Catalog, Draft, Piece } from "../../ports/catalog";

export function createMemoryCatalog(): Catalog {
  let draft: Draft | null = null;
  const pieces: Piece[] = [];
  const byPreview = new Map<string, Piece>();
  const takenDown = new Set<number>();
  let last: Action | null = null;

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
      last = { id: previewId, kind: "publish", piece };
      return piece;
    },
    async publishedFrom(previewId) {
      return byPreview.get(previewId) ?? null;
    },
    async published() {
      return pieces.filter((piece) => !takenDown.has(piece.number)).reverse();
    },
    async piece(number) {
      const piece = pieces[number - 1];
      if (!piece) return null;
      const status = takenDown.has(number) ? "takenDown" : "published";
      return { ...piece, status };
    },
    async takeDown(number, id) {
      takenDown.add(number);
      const piece = pieces[number - 1];
      if (piece) last = { id, kind: "takeDown", piece };
    },
    async undo(actionId) {
      const action = last;
      if (!action || (actionId && actionId !== action.id)) return null;
      if (action.kind === "publish") takenDown.add(action.piece.number);
      else takenDown.delete(action.piece.number);
      last = null;
      return action;
    },
  };
}
