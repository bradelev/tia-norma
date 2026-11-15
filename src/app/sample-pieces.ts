import type { Piece } from "@/ports/catalog";
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
 */
export const samplePieces: Piece[] = [
  {
    number: 4,
    name: "Jarra con relieve",
    price: 9500,
    image: jarraConRelieve.src,
  },
  {
    number: 3,
    name: "Florero calabaza",
    price: 125000,
    image: floreroCalabaza.src,
  },
  { number: 2, name: "Jarra de barro", price: 12000, image: jarraDeBarro.src },
  {
    number: 1,
    name: "Cuenco blanco y azul",
    price: 8500,
    image: cuencoBlancoYAzul.src,
  },
];
