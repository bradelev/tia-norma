import { after } from "next/server";
import { whatsapp } from "../../whatsapp";

/** Meta's handshake when the webhook URL is registered. */
export function GET(request: Request) {
  return whatsapp().verify(new URL(request.url));
}

/** Answers 200 right away; the bot works after the response (R8, R9). */
export function POST(request: Request) {
  return whatsapp().receive(request, after);
}
