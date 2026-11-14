import type { Catalog, Draft } from "../ports/catalog";
import type { Interpreter } from "../ports/interpreter";
import type { MediaStore } from "../ports/media-store";
import type { Incoming, Reply } from "./messages";
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

export interface BotPorts {
  catalog: Catalog;
  media: MediaStore;
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

  async function describe(text: string): Promise<Reply> {
    const intent = await ports.interpreter.interpret(text);
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
        case "photo": {
          const photo = await ports.media.save(message.bytes, "image/jpeg");
          return update({ photo });
        }
        case "text":
          return describe(message.text);
        case "button": {
          const [action, previewId = ""] = message.id.split(":");
          if (action === "publish") return publish(previewId);
          return { text: "¿Qué cambio?" };
        }
      }
    },
  };
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
