import type { StaticImageData } from "next/image";
import cuencoBlancoYAzul from "./samples/cuenco-blanco-y-azul.jpg";
import floreroCalabaza from "./samples/florero-calabaza.jpg";
import jarraConRelieve from "./samples/jarra-con-relieve.jpg";
import jarraDeBarro from "./samples/jarra-de-barro.jpg";

export type Piece = {
  id: string;
  name: string;
  price: number;
  image: StaticImageData;
};

/**
 * Sample data until the catalog is wired. Names and prices are invented.
 * Photos are CC0 from The Metropolitan Museum of Art, via Wikimedia Commons:
 * - Bowl Emulating Chinese Stoneware MET DP170381
 * - Pitcher MET DP207616
 * - Gourd-shaped vase MET DP-13486-049
 * - Pitcher MET DP220563
 */
export const samplePieces: Piece[] = [
  { id: "4", name: "Jarra con relieve", price: 9500, image: jarraConRelieve },
  { id: "3", name: "Florero calabaza", price: 125000, image: floreroCalabaza },
  { id: "2", name: "Jarra de barro", price: 12000, image: jarraDeBarro },
  {
    id: "1",
    name: "Cuenco blanco y azul",
    price: 8500,
    image: cuencoBlancoYAzul,
  },
];
