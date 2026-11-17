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

// Index = value: "cero" is 0, "un" is 1 ... "veintinueve" is 29.
const ONES = (
  "cero un dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince " +
  "dieciseis diecisiete dieciocho diecinueve veinte veintiun veintidos veintitres veinticuatro " +
  "veinticinco veintiseis veintisiete veintiocho veintinueve"
).split(" ");
const TENS = "treinta cuarenta cincuenta sesenta setenta ochenta noventa".split(
  " ",
);
const HUNDREDS =
  "ciento doscientos trescientos cuatrocientos quinientos seiscientos setecientos ochocientos novecientos".split(
    " ",
  );

function isHundredsWord(word: string): boolean {
  return word === "cien" || HUNDREDS.includes(word);
}

function wordValue(word: string): number | undefined {
  if (word === "uno" || word === "una") return 1;
  if (word === "veintiuno") return 21;
  if (word === "cien") return 100;
  const one = ONES.indexOf(word);
  if (one !== -1) return one;
  const ten = TENS.indexOf(word);
  if (ten !== -1) return (ten + 3) * 10;
  const hundred = HUNDREDS.indexOf(word);
  if (hundred !== -1) return (hundred + 1) * 100;
  return undefined;
}

/**
 * Reads a price the way Norma says or writes it: "seis mil", "6 mil", "6000", "$6.000", "12,5 mil", "5 lucas".
 * Returns whole pesos, or null if the text is not a price.
 */
export function parsePrice(said: string): number | null {
  const tokens = said
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\$|\bpesos\b/g, " ")
    .split(/\s+/)
    .filter((token) => token !== "" && token !== "y");
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;
  for (const token of tokens) {
    const value = numberToken(token) ?? wordValue(token);
    if (
      value !== undefined &&
      isHundredsWord(token) &&
      total === 0 &&
      current > 0 &&
      current < 100
    ) {
      // "cuatro quinientos" leaves "mil" unsaid: it means 4500, not 504.
      total = current * 1000;
      current = value;
    } else if (value !== undefined) {
      current += value;
    } else if (token === "mil" || token === "luca" || token === "lucas") {
      total += (current || 1) * 1000;
      current = 0;
    } else if (token === "millon" || token === "millones") {
      total = (total + (current || 1)) * 1_000_000;
      current = 0;
    } else {
      return null;
    }
  }
  const pesos = total + current;
  return Number.isInteger(pesos) && pesos > 0 ? pesos : null;
}

/** "6000", "6.000" or "16,500" (thousands, as transcriptions write them) or "12,5" (decimal comma). */
function numberToken(token: string): number | undefined {
  if (/^\d{1,3}([.,]\d{3})+$/.test(token))
    return Number(token.replaceAll(/[.,]/g, ""));
  if (/^\d+(,\d+)?$/.test(token)) return Number(token.replace(",", "."));
  return undefined;
}
