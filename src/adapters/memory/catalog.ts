import type { Action, Catalog, Draft, Piece } from "../../ports/catalog";

export function createMemoryCatalog(): Catalog {
  let draft: Draft | null = null;
  const pieces: Piece[] = [];
  const byPreview = new Map<string, Piece>();
  const takenDown = new Set<number>();
  const publishedAt = new Map<number, Date>();
  /** `before` is the piece as it was, for a change. */
  let last: { action: Action; before?: Piece } | null = null;
  const messages = new Set<string>();

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
      publishedAt.set(piece.number, new Date());
      byPreview.set(previewId, piece);
      draft = null;
      last = { action: { id: previewId, kind: "publish", piece } };
      return piece;
    },
    async nextNumber() {
      return pieces.length + 1;
    },
    async publishedFrom(previewId) {
      return byPreview.get(previewId) ?? null;
    },
    async published() {
      return pieces
        .filter((piece) => !takenDown.has(piece.number))
        .map((piece) => ({
          ...piece,
          publishedAt: publishedAt.get(piece.number)!,
        }))
        .reverse();
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
      if (piece) last = { action: { id, kind: "takeDown", piece } };
    },
    async change(previewId, change) {
      const before = pieces[change.number - 1];
      if (draft?.previewId !== previewId || !before) return null;
      const [kind, piece]: [Action["kind"], Piece] =
        "price" in change
          ? ["changePrice", { ...before, price: change.price }]
          : ["changePhoto", { ...before, image: change.image }];
      pieces[piece.number - 1] = piece;
      draft = null;
      last = { action: { id: previewId, kind, piece }, before };
      return piece;
    },
    async undo(actionId) {
      if (!last || (actionId && actionId !== last.action.id)) return null;
      const { action, before } = last;
      last = null;
      if (before) {
        pieces[before.number - 1] = before;
        return { ...action, piece: before };
      }
      if (action.kind === "publish") takenDown.add(action.piece.number);
      else takenDown.delete(action.piece.number);
      return action;
    },
    async recordMessage(messageId) {
      if (messages.has(messageId)) return false;
      messages.add(messageId);
      return true;
    },
  };
}
