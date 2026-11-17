import type {
  Catalog,
  Change,
  Draft,
  Piece,
  StoredPiece,
} from "../ports/catalog";
import type { ImageProcessor } from "../ports/image-processor";
import type { Interpreter, PieceRef } from "../ports/interpreter";
import type { MediaStore } from "../ports/media-store";
import type { PreviewRenderer, SlipContent } from "../ports/preview-renderer";
import { FIXED_REPLIES, type Incoming, type Reply } from "./messages";
import type { PhotoProblem } from "./photo-quality";
import { formatPrice, parsePrice } from "./price";

const MAX_PRICE = 10_000_000;
const MAX_NAME_LENGTH = 40;
/** A preview with no answer expires silently after this. */
const PREVIEW_LIFETIME_MS = 24 * 60 * 60 * 1000;
const ASK_PRICE_AGAIN =
  "¿Cuánto sale? Decímelo en pesos, por ejemplo seis mil.";
const ASK_SHORTER_NAME = "¿Me decís un nombre más corto? Hasta 40 letras.";
/** WhatsApp shows at most 10 rows in a list, each title up to 24 characters. */
const LIST_ROWS = 10;
const ROW_TITLE_LENGTH = 24;
const STALE_PREVIEW =
  "Esa vista previa ya cambió. Fijate en la última que te mandé.";
/** Keeps "Escuché: "…". No te entendí…" within the 160 characters of a reply. */
const MAX_HEARD_LENGTH = 100;
const ASK_ANOTHER_PHOTO: Record<PhotoProblem, string> = {
  blurry: "La foto salió movida. ¿Me mandás otra?",
  dark: "La foto salió oscura. ¿Me mandás otra con más luz?",
};

export interface BotPorts {
  catalog: Catalog;
  media: MediaStore;
  images: ImageProcessor;
  previews: PreviewRenderer;
  interpreter: Interpreter;
  newId: () => string;
  /** Milliseconds since the epoch, like `Date.now`. */
  now: () => number;
}

export interface Bot {
  /** Once `deadline` aborts, nothing more is written for this message (R10). */
  receive(message: Incoming, deadline?: AbortSignal): Promise<Reply>;
}

export function createBot(ports: BotPorts): Bot {
  return {
    receive(message, deadline) {
      const catalog = deadline
        ? untilDeadline(ports.catalog, deadline)
        : ports.catalog;
      return conversation({ ...ports, catalog }).receive(message);
    },
  };
}

/**
 * A late result may still read, but every write checks the deadline first:
 * publishing, taking down, changing, undoing and opening a preview.
 */
function untilDeadline(catalog: Catalog, deadline: AbortSignal): Catalog {
  function checked<A extends unknown[], R>(
    write: (...args: A) => Promise<R>,
  ): (...args: A) => Promise<R> {
    return async (...args) => {
      deadline.throwIfAborted();
      return write(...args);
    };
  }
  return {
    ...catalog,
    saveDraft: checked(catalog.saveDraft),
    publish: checked(catalog.publish),
    takeDown: checked(catalog.takeDown),
    change: checked(catalog.change),
    undo: checked(catalog.undo),
  };
}

function conversation(ports: BotPorts): Bot {
  const { catalog } = ports;

  /** Adds to the draft of a new piece; an open change is dropped. */
  async function update(fields: Partial<Draft>): Promise<Reply> {
    const open = await catalog.draft();
    const left = forChange(open) ? discarded(open) : "";
    const draft = { ...pieceDraft(open), ...fields };
    if (!isComplete(draft)) {
      await catalog.saveDraft(draft);
      return { text: left + askForMissing(draft) };
    }
    const { photo, name, price } = draft;
    const number = await catalog.nextNumber();
    const image = await slip({ photo, number, name, price });
    const previewId = ports.newId();
    await catalog.saveDraft({
      ...draft,
      previewId,
      previewSentAt: ports.now(),
    });
    return {
      text: `${left}${name}, ${formatPrice(price)}`,
      image,
      buttons: [
        { id: `publish:${previewId}`, title: "Sí, publicar" },
        { id: `fix:${previewId}`, title: "No, corregir" },
      ],
    };
  }

  /** Keeps the original next to the treated one; a rejected photo leaves the draft as it was. */
  async function receivePhoto(original: Uint8Array): Promise<Reply> {
    const result = await ports.images.treat(original);
    if ("problem" in result) return { text: ASK_ANOTHER_PHOTO[result.problem] };
    const [, photo] = await Promise.all([
      ports.media.save(original, "image/jpeg"),
      ports.media.save(result.treated, "image/jpeg"),
    ]);
    const photoFor = (await catalog.draft())?.photoFor;
    if (photoFor !== undefined) {
      await catalog.saveDraft({});
      return changePhoto({ number: photoFor }, photo);
    }
    return update({ photo });
  }

  /** Published pieces whose name has every word Norma said, by number. */
  async function named(said: string): Promise<Piece[]> {
    return (await catalog.published())
      .filter((piece) => matchesName(piece.name, said))
      .sort((a, b) => a.number - b.number);
  }

  /** A piece on the page, or what to tell Norma when there is no single one. */
  async function find(ref: PieceRef): Promise<StoredPiece | Reply> {
    if ("name" in ref) {
      const found = await named(ref.name);
      const [only, ...rest] = found;
      if (!only)
        return { text: `No encontré ninguna pieza que se llame ${ref.name}` };
      if (rest.length > 0)
        return {
          text: "¿Cuál? Decime el número.",
          album: found.map((piece) => ({
            image: piece.image,
            caption: `La ${piece.number}, ${piece.name}`,
          })),
        };
      return find({ number: only.number });
    }
    const piece = await catalog.piece(ref.number);
    if (!piece) return { text: `No tengo ninguna pieza ${ref.number}` };
    if (piece.status === "takenDown")
      return { text: `La ${piece.number} ya no está en la página` };
    return piece;
  }

  /** Without a single match by name, Norma picks the piece from a list. */
  async function takeDown(ref: PieceRef): Promise<Reply> {
    if ("name" in ref) {
      const found = await named(ref.name);
      if (found.length > 1) return pickToTakeDown(found, "", true);
      if (!found[0]) {
        const notFound = `No encontré ninguna pieza que se llame ${ref.name}. `;
        return pickToTakeDown(await catalog.published(), notFound, false);
      }
      ref = { number: found[0].number };
    }
    const piece = await find(ref);
    if ("text" in piece) return piece;
    const actionId = ports.newId();
    await catalog.takeDown(piece.number, actionId);
    return {
      text: `Saqué la pieza ${piece.number}`,
      image: piece.image,
      buttons: [{ id: `undo:${actionId}`, title: "Deshacer" }],
    };
  }

  /** Each row takes its piece down like "sacá la N" would. */
  function pickToTakeDown(
    pieces: Piece[],
    before: string,
    withPhotos: boolean,
  ): Reply {
    if (pieces.length === 0)
      return { text: "No hay ninguna pieza en la página." };
    const more =
      pieces.length > LIST_ROWS ? " Si no está, decime el número." : "";
    const shown = pieces.slice(0, LIST_ROWS);
    return {
      text: `${before}¿Cuál sacás?${more}`,
      ...(withPhotos && {
        album: shown.map((piece) => ({
          image: piece.image,
          caption: `La ${piece.number}, ${piece.name}`,
        })),
      }),
      list: {
        button: "Ver piezas",
        rows: shown.map((piece) => ({
          id: `takeDown:${piece.number}`,
          title: clip(`${piece.number}. ${piece.name}`, ROW_TITLE_LENGTH),
          description: formatPrice(piece.price),
        })),
      },
    };
  }

  async function changePrice(ref: PieceRef, priceText: string): Promise<Reply> {
    const piece = await find(ref);
    if ("text" in piece) return piece;
    const price = parsePrice(priceText);
    if (price === null || price > MAX_PRICE) return { text: ASK_PRICE_AGAIN };
    const text = `Antes ${formatPrice(piece.price)}, ahora ${formatPrice(price)}`;
    return propose({ number: piece.number, price }, text, {
      number: piece.number,
      name: piece.name,
      price,
      photo: piece.image,
    });
  }

  /** Without a photo, takes the one in the draft or waits for the next one. */
  async function changePhoto(ref: PieceRef, photo?: string): Promise<Reply> {
    const piece = await find(ref);
    if ("text" in piece) return piece;
    const draft = await catalog.draft();
    const image = photo ?? draft?.photo;
    if (image === undefined) {
      await catalog.saveDraft({ photoFor: piece.number });
      const text = `Mandame la foto nueva de la pieza ${piece.number}.`;
      return { text: discarded(draft) + text };
    }
    const text = `Foto nueva para la pieza ${piece.number}`;
    return propose({ number: piece.number, image }, text, {
      number: piece.number,
      name: piece.name,
      price: piece.price,
      photo: image,
    });
  }

  /** Previews sent before this field existed never expire. */
  function expired(draft: Draft | null): boolean {
    const sentAt = draft?.previewSentAt;
    return sentAt !== undefined && ports.now() - sentAt >= PREVIEW_LIFETIME_MS;
  }

  /** The preview image: the slip as the page will show it, or the bare photo if it cannot be drawn. */
  async function slip(content: SlipContent): Promise<string> {
    try {
      const png = await ports.previews.render(content);
      return await ports.media.save(png, "image/png");
    } catch {
      return content.photo;
    }
  }

  /** Opens a change preview in place of whatever was open. */
  async function propose(
    change: Change,
    text: string,
    shown: SlipContent,
  ): Promise<Reply> {
    const image = await slip(shown);
    const previewId = ports.newId();
    const left = discarded(await catalog.draft());
    await catalog.saveDraft({ change, previewId, previewSentAt: ports.now() });
    return {
      text: left + text,
      image,
      buttons: [
        { id: `change:${previewId}`, title: "Sí, cambiar" },
        { id: `keep:${previewId}`, title: "No" },
      ],
    };
  }

  async function applyChange(previewId: string): Promise<Reply> {
    const draft = await catalog.draft();
    const { change, previewId: open } = draft ?? {};
    if (!change || open !== previewId) return { text: STALE_PREVIEW };
    if (expired(draft)) return FIXED_REPLIES.tryAgain;
    const found = await find({ number: change.number });
    if ("text" in found) return found;
    const piece = await catalog.change(previewId, change);
    if (!piece) return { text: STALE_PREVIEW };
    return {
      text:
        "price" in change
          ? `Listo. La pieza ${piece.number} ahora sale ${formatPrice(piece.price)}`
          : `Listo. La pieza ${piece.number} tiene la foto nueva`,
      image: piece.image,
      buttons: [{ id: `undo:${previewId}`, title: "Deshacer" }],
    };
  }

  async function keep(previewId: string): Promise<Reply> {
    const { change, previewId: open } = (await catalog.draft()) ?? {};
    if (!change || open !== previewId) return { text: STALE_PREVIEW };
    await catalog.saveDraft({});
    return { text: "No cambié nada." };
  }

  /** Said, it undoes the last action; a button only undoes the action it was offered for. */
  async function undo(actionId?: string): Promise<Reply> {
    const action = await catalog.undo(actionId);
    if (!action) return { text: "No hay nada para deshacer" };
    const { number, image, price } = action.piece;
    const texts: Record<typeof action.kind, string> = {
      publish: `La pieza ${number} ya no está en la página`,
      takeDown: `La pieza ${number} volvió a la página`,
      changePrice: `La pieza ${number} vuelve a salir ${formatPrice(price)}`,
      changePhoto: `La pieza ${number} vuelve a tener la foto anterior`,
    };
    return { text: texts[action.kind], image };
  }

  async function understand(text: string, spoken = false): Promise<Reply> {
    const intent = await ports.interpreter.interpret(text);
    if (intent.kind === "takeDown") return takeDown(intent.piece);
    if (intent.kind === "changePrice")
      return changePrice(intent.piece, intent.priceText);
    if (intent.kind === "changePhoto") return changePhoto(intent.piece);
    if (intent.kind === "undo") return undo();
    if (intent.kind !== "describe")
      return spoken ? misheard(text) : FIXED_REPLIES.help;
    const change: Partial<Draft> = {};
    if (intent.name !== undefined) {
      if (intent.name.length > MAX_NAME_LENGTH)
        return { text: ASK_SHORTER_NAME };
      change.name = intent.name;
    }
    if (intent.priceText !== undefined) {
      const price = parsePrice(intent.priceText);
      const open = await catalog.draft();
      const unreadable = price === null || price > MAX_PRICE;
      // A new name with a misheard price keeps the price she already gave; the preview shows it.
      if (unreadable && change.name && pieceDraft(open).price !== undefined)
        return update(change);
      if (unreadable) {
        // The open preview no longer shows the draft, so its "Sí" must not publish it.
        const draft = { ...pieceDraft(open), ...change };
        delete draft.previewId;
        await catalog.saveDraft(draft);
        return { text: ASK_PRICE_AGAIN };
      }
      change.price = price;
    }
    return update(change);
  }

  async function publish(previewId: string): Promise<Reply> {
    const already = await catalog.publishedFrom(previewId);
    if (already) return confirmation(already.number);
    const draft = await catalog.draft();
    if (draft?.previewId !== previewId || !isComplete(draft))
      return { text: STALE_PREVIEW };
    if (expired(draft)) return FIXED_REPLIES.tryAgain;
    const piece = await catalog.publish(previewId, {
      name: draft.name,
      price: draft.price,
      image: draft.photo,
    });
    return confirmation(piece.number);
  }

  return {
    async receive(message) {
      switch (message.kind) {
        case "photo":
          return receivePhoto(message.bytes);
        case "text":
          return understand(message.text);
        case "audio":
          return understand(message.text, true);
        case "button": {
          const [action, id = ""] = message.id.split(":");
          if (action === "publish") return publish(id);
          if (action === "undo") return undo(id);
          if (action === "change") return applyChange(id);
          if (action === "keep") return keep(id);
          if (action === "takeDown" && /^\d+$/.test(id))
            return takeDown({ number: Number(id) });
          return { text: "¿Qué cambio?" };
        }
      }
    },
  };
}

/** What the bot heard, so Norma knows what to repeat and we can tell a mishearing from a misunderstanding. */
function misheard(said: string): Reply {
  const heard = said.trim().replace(/\s+/g, " ");
  if (!heard) return FIXED_REPLIES.help;
  return {
    text: `Escuché: "${shorten(heard)}". No te entendí, ¿me lo decís de nuevo?`,
  };
}

/** Cuts at the last whole word that fits. */
function shorten(text: string): string {
  if (text.length <= MAX_HEARD_LENGTH) return text;
  const cut = text.slice(0, MAX_HEARD_LENGTH - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
}

/** Words Norma says around a name: "la del post de WhatsApp". */
const FILLER = new Set(["la", "el", "los", "las", "del", "de"]);

/** Every word Norma said appears in the name, ignoring accents, case and filler. */
function matchesName(name: string, said: string): boolean {
  const own = new Set(words(name));
  const wanted = words(said).filter((word) => !FILLER.has(word));
  return wanted.length > 0 && wanted.every((word) => own.has(word));
}

function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** What Norma is told when a new preview replaces what she had open. */
function discarded(draft: Draft | null): string {
  const number = draft?.change?.number ?? draft?.photoFor;
  if (number !== undefined) return `La pieza ${number} quedó sin cambiar. `;
  if (draft?.name) return `${draft.name} quedó sin publicar. `;
  return "";
}

function forChange(draft: Draft | null): boolean {
  return draft?.change !== undefined || draft?.photoFor !== undefined;
}

/** The draft of a new piece, without an open change. */
function pieceDraft(draft: Draft | null): Draft {
  return draft && !forChange(draft) ? draft : {};
}

function askForMissing({ photo, name, price }: Draft): string {
  if (photo === undefined) return "Mandame una foto de la pieza.";
  if (name === undefined && price === undefined)
    return "¿Cómo se llama la pieza y cuánto sale?";
  if (name === undefined) return "¿Cómo se llama la pieza?";
  return "¿Cuánto sale?";
}

type CompleteDraft = Required<Pick<Draft, "photo" | "name" | "price">> & Draft;

function isComplete(draft: Draft): draft is CompleteDraft {
  return (
    draft.photo !== undefined &&
    draft.name !== undefined &&
    draft.price !== undefined
  );
}

function clip(text: string, length: number): string {
  return text.length > length
    ? `${text.slice(0, length - 1).trimEnd()}…`
    : text;
}

function confirmation(number: number): Reply {
  return { text: `Listo. Es la pieza ${number}.` };
}
