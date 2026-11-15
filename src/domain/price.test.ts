import { describe, expect, it } from "vitest";
import { formatPrice, parsePrice } from "./price";

describe("formatPrice", () => {
  it("formats whole pesos with a thousands dot and a non-breaking space", () => {
    expect(formatPrice(6000)).toBe("$ 6.000");
    expect(formatPrice(12500)).toBe("$ 12.500");
    expect(formatPrice(800)).toBe("$ 800");
  });
});

describe("parsePrice (R11)", () => {
  it.each([
    ["seis mil", 6000],
    ["6 mil", 6000],
    ["6000", 6000],
    ["$6.000", 6000],
    ["$ 6.000", 6000],
    ["6.000 pesos", 6000],
    ["doce mil quinientos", 12500],
    ["ciento veinte mil", 120000],
    ["veintidós mil", 22000],
    ["treinta y cinco mil", 35000],
    ["ochocientos", 800],
    ["cien", 100],
    ["un millón", 1000000],
    ["mil quinientos", 1500],
    ["12,5 mil", 12500],
    ["5 lucas", 5000],
    ["una luca", 1000],
  ])('"%s" son %i pesos', (said, pesos) => {
    expect(parsePrice(said)).toBe(pesos);
  });

  it.each(["carísima", "", "seis con cincuenta", "0", "1,5"])(
    '"%s" no es un precio',
    (said) => {
      expect(parsePrice(said)).toBeNull();
    },
  );
});
