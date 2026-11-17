import type { ShownPiece } from "@/ports/catalog";
import cuencoBlancoYAzul from "./samples/cuenco-blanco-y-azul.jpg";
import floreroCalabaza from "./samples/florero-calabaza.jpg";
import jarraConRelieve from "./samples/jarra-con-relieve.jpg";
import jarraDeBarro from "./samples/jarra-de-barro.jpg";

/**
 * Shown when Supabase is not configured, so `pnpm dev` and CI need no keys. Names and prices are invented.
 * Photos are CC0 from The Metropolitan Museum of Art, via Wikimedia Commons:
 * - Bowl Emulating Chinese Stoneware MET DP170381
 * - Pitcher MET DP207616
 * - Gourd-shaped vase MET DP-13486-049
 * - Pitcher MET DP220563
 * The newest one is always a day old, so the "Nueva" stamp shows.
 */
const day = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * day);

export const samplePieces: ShownPiece[] = [
  {
    number: 4,
    name: "Jarra con relieve",
    price: 9500,
    image: jarraConRelieve.src,
    publishedAt: daysAgo(1),
  },
  {
    number: 3,
    name: "Florero calabaza",
    price: 125000,
    image: floreroCalabaza.src,
    publishedAt: daysAgo(20),
  },
  {
    number: 2,
    name: "Jarra de barro",
    price: 12000,
    image: jarraDeBarro.src,
    publishedAt: daysAgo(40),
  },
  {
    number: 1,
    name: "Cuenco blanco y azul",
    price: 8500,
    image: cuencoBlancoYAzul.src,
    publishedAt: daysAgo(60),
  },
];
