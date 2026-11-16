/**
 * How a piece card looks. The page reads these as CSS custom properties and the
 * preview image draws with them, so Norma sees what the buyer sees. Sizes in rem.
 */
export const card = {
  /** The table the raffle book lies on: clearly darker than every paper. */
  ground: "#d8d3c9",
  paper: "#ffffff",
  ink: "#1c1b19",
  /** Raffle-book papers. A piece keeps its paper for life: number % 4. */
  papers: ["#f8e1e5", "#dff0e0", "#fbf1c4", "#dfeaf6"],
  /** Photo width at its widest. */
  column: 40,
  /** Paper around the photo; on the page it grows with the viewport between min and max. */
  frame: { min: 0.75, fluid: "3.5vw", max: 1.375 },
  /** Bottom margin of the paper, in frames. */
  frameBottom: 1.5,
  /** Space between photo and name, in frames. */
  captionTop: 1.1,
  photo: { width: 4, height: 5 },
  name: { size: 1.75, weight: 600, leading: 1.2 },
  price: { size: 2.25, weight: 800, leading: 1.15, gap: 0.25 },
} as const;

export const cardCssVariables: Record<`--${string}`, string> = {
  "--ground": card.ground,
  "--paper": card.paper,
  "--ink": card.ink,
  ...Object.fromEntries(card.papers.map((color, i) => [`--paper-${i}`, color])),
  "--column": `${card.column}rem`,
  "--frame": `clamp(${card.frame.min}rem, ${card.frame.fluid}, ${card.frame.max}rem)`,
  "--frame-bottom": `${card.frameBottom}`,
  "--caption-top": `${card.captionTop}`,
  "--photo-ratio": `${card.photo.width} / ${card.photo.height}`,
  "--text-name": `${card.name.size}rem`,
  "--name-weight": `${card.name.weight}`,
  "--name-leading": `${card.name.leading}`,
  "--text-price": `${card.price.size}rem`,
  "--price-weight": `${card.price.weight}`,
  "--price-leading": `${card.price.leading}`,
  "--price-gap": `${card.price.gap}rem`,
};
