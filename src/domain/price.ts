const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * 6000 -> "$ 6.000". The space after "$" is a non-breaking space (U+00A0);
 * the page splits on it to decide where a zoomed price may wrap.
 */
export function formatPrice(pesosAmount: number): string {
  return pesos.format(pesosAmount);
}
