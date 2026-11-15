import type { Catalog, Draft } from "../ports/catalog";
import type { ImageProcessor } from "../ports/image-processor";
import type { Interpreter, PieceRef } from "../ports/interpreter";
import type { MediaStore } from "../ports/media-store";
import type { Incoming, Reply } from "./messages";
import type { PhotoProblem } from "./photo-quality";
import { formatPrice, parsePrice } from "./price";

const MAX_PRICE = 10_000_000;
const MAX_NAME_LENGTH = 40;
const HELP =
  "Para publicar, mandame una foto de la pieza y decime cómo se llama y cuánto sale.";
const ASK_PRICE_AGAIN =
  "¿Cuánto sale? Decímelo en pesos, por ejemplo seis mil.";
const ASK_SHORTER_NAME = "¿Me decís un nombre más corto? Hasta 40 letras.";
const STALE_PREVIEW =
  "Esa vista previa ya cambió. Fijate en la última que te mandé.";
const ASK_ANOTHER_PHOTO: Record<PhotoProblem, string> = {
  blurry: "La foto salió movida. ¿Me mandás otra?",
  dark: "La foto salió oscura. ¿Me mandás otra con más luz?",
};

export interface BotPorts {
  catalog: Catalog;
  media: MediaStore;
  images: ImageProcessor;
  interpreter: Interpreter;
  newId: () => string;
}

export interface Bot {
  receive(message: Incoming): Promise<Reply>;
}

export function createBot(ports: BotPorts): Bot {
  const { catalog } = ports;

  async function update(change: Partial<Draft>): Promise<Reply> {
    const draft = { ...(await catalog.draft()), ...change };
    if (!isComplete(draft)) {
      await catalog.saveDraft(draft);
      return { text: askForMissing(draft) };
    }
    const { photo, name, price } = draft;
    const previewId = ports.newId();
    await catalog.saveDraft({ ...draft, previewId });
    return {
      text: `${name}, ${formatPrice(price)}`,
      image: photo,
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
    return update({ photo });
  }

  async function takeDown(ref: PieceRef): Promise<Reply> {
    if ("name" in ref) {
      const found = (await catalog.published())
        .filter((piece) => matchesName(piece.name, ref.name))
        .sort((a, b) => a.number - b.number);
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
      return takeDown({ number: only.number });
    }
    const piece = await catalog.piece(ref.number);
    if (!piece) return { text: `No tengo ninguna pieza ${ref.number}` };
    if (piece.status === "takenDown")
      return { text: `La ${piece.number} ya no está en la página` };
    const actionId = ports.newId();
    await catalog.takeDown(piece.number, actionId);
    return {
      text: `Saqué la pieza ${piece.number}`,
      image: piece.image,
      buttons: [{ id: `undo:${actionId}`, title: "Deshacer" }],
    };
  }

  /** Said, it undoes the last action; a button only undoes the action it was offered for. */
  async function undo(actionId?: string): Promise<Reply> {
    const action = await catalog.undo(actionId);
    if (!action) return { text: "No hay nada para deshacer" };
    const { number, image } = action.piece;
    const text =
      action.kind === "publish"
        ? `La pieza ${number} ya no está en la página`
        : `La pieza ${number} volvió a la página`;
    return { text, image };
  }

  async function understand(text: string): Promise<Reply> {
    const intent = await ports.interpreter.interpret(text);
    if (intent.kind === "takeDown") return takeDown(intent.piece);
    if (intent.kind === "undo") return undo();
    if (intent.kind !== "describe") return { text: HELP };
    const change: Partial<Draft> = {};
    if (intent.name !== undefined) {
      if (intent.name.length > MAX_NAME_LENGTH)
        return { text: ASK_SHORTER_NAME };
      change.name = intent.name;
    }
    if (intent.priceText !== undefined) {
      const price = parsePrice(intent.priceText);
      if (price === null || price > MAX_PRICE) {
        await catalog.saveDraft({ ...(await catalog.draft()), ...change });
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
        case "button": {
          const [action, id = ""] = message.id.split(":");
          if (action === "publish") return publish(id);
          if (action === "undo") return undo(id);
          return { text: "¿Qué cambio?" };
        }
      }
    },
  };
}

/** Every word Norma said appears in the name, ignoring accents and case. */
function matchesName(name: string, said: string): boolean {
  const own = new Set(words(name));
  const wanted = words(said);
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

function confirmation(number: number): Reply {
  return { text: `Listo. Es la pieza ${number}.` };
}
