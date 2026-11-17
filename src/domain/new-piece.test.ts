import { describe, expect, it } from "vitest";
import { isNew } from "./new-piece";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-17T12:00:00-03:00");
const ago = (ms: number) => new Date(now.getTime() - ms);

describe("una pieza es nueva", () => {
  it("durante la semana después de publicarse", () => {
    expect(isNew(ago(0), now)).toBe(true);
    expect(isNew(ago(6 * day), now)).toBe(true);
  });

  it("y deja de serlo a los 7 días", () => {
    expect(isNew(ago(7 * day), now)).toBe(false);
    expect(isNew(ago(30 * day), now)).toBe(false);
  });
});
