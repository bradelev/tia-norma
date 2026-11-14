import { describe, expect, it } from "vitest";
import { formatPrice } from "./price";

describe("formatPrice", () => {
  it("formats whole pesos with a thousands dot and a non-breaking space", () => {
    expect(formatPrice(6000)).toBe("$ 6.000");
    expect(formatPrice(12500)).toBe("$ 12.500");
    expect(formatPrice(800)).toBe("$ 800");
  });
});
