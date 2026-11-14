import type { Catalog, Draft } from "../ports/catalog";
import type { Interpreter } from "../ports/interpreter";
import type { MediaStore } from "../ports/media-store";
import type { Incoming, Reply } from "./messages";
import { formatPrice, parsePrice } from "./price";

const HELP =
  "Para publicar, mandame una foto de la pieza y decime cómo se llama y cuánto sale.";

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
      return { text: HELP };
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
    if (intent.name !== undefined) change.name = intent.name;
    const price = intent.priceText ? parsePrice(intent.priceText) : null;
    if (price !== null) change.price = price;
    return update(change);
  }

  async function publish(previewId: string): Promise<Reply> {
    const draft = await catalog.draft();
    if (draft?.previewId !== previewId || !isComplete(draft))
      return { text: HELP };
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
          return { text: HELP };
        }
      }
    },
  };
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
