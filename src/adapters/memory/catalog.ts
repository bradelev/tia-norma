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
      const piece = { number: pieces.length + 1, ...data };
      pieces.push(piece);
      byPreview.set(previewId, piece);
      draft = null;
      last = { kind: "publish", piece };
      return piece;
    },
    async publishedFrom(previewId) {
      return byPreview.get(previewId) ?? null;
    },
    async published() {
      return pieces.filter((piece) => !takenDown.has(piece.number));
    },
    async piece(number) {
      const piece = pieces[number - 1];
      if (!piece) return null;
      const status = takenDown.has(number) ? "takenDown" : "published";
      return { ...piece, status };
    },
    async takeDown(number) {
      takenDown.add(number);
      const piece = pieces[number - 1];
      if (piece) last = { kind: "takeDown", piece };
    },
    async undo() {
      const action = last;
      if (!action) return null;
      if (action.kind === "publish") takenDown.add(action.piece.number);
      else takenDown.delete(action.piece.number);
      last = null;
      return action;
    },
  };
}
