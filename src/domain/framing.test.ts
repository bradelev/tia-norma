import { describe, expect, it } from "vitest";
import { frame } from "./framing";

/** A phone photo, upright: 3:4. */
const photo = { width: 1200, height: 1600 };

describe("encuadre alrededor de la pieza", () => {
  it("centra una pieza chica corrida a un costado y la agranda", () => {
    const piece = { left: 0.2, top: 0.2, right: 0.5, bottom: 0.45 };

    const crop = frame(piece, photo);

    expect(crop.width / crop.height).toBeCloseTo(4 / 5, 2);
    const center = {
      x: (crop.left + crop.width / 2) / photo.width,
      y: (crop.top + crop.height / 2) / photo.height,
    };
    expect(center.x).toBeCloseTo(0.35, 2);
    expect(center.y).toBeCloseTo(0.325, 2);
    expect(crop.width).toBeLessThan(photo.width * 0.6);
  });

  it("deja aire alrededor: la pieza no toca el borde", () => {
    const piece = { left: 0.3, top: 0.3, right: 0.7, bottom: 0.7 };

    const crop = frame(piece, photo);

    expect(crop.left).toBeLessThan(0.3 * photo.width);
    expect(crop.left + crop.width).toBeGreaterThan(0.7 * photo.width);
    expect(crop.top).toBeLessThan(0.3 * photo.height);
    expect(crop.top + crop.height).toBeGreaterThan(0.7 * photo.height);
  });

  it("no se sale de la foto cuando la pieza está contra el borde", () => {
    const piece = { left: 0, top: 0.8, right: 0.3, bottom: 1 };

    const crop = frame(piece, photo);

    expect(crop.left).toBe(0);
    expect(crop.top + crop.height).toBe(photo.height);
  });

  it("con una pieza que llena la foto, usa la foto entera en 4:5", () => {
    const crop = frame({ left: 0, top: 0, right: 1, bottom: 1 }, photo);

    expect(crop).toEqual({ left: 0, top: 50, width: 1200, height: 1500 });
  });

  it("no amplía una pieza diminuta más allá de la mitad de la foto", () => {
    const piece = { left: 0.49, top: 0.49, right: 0.51, bottom: 0.51 };

    expect(frame(piece, photo).width).toBe(600);
  });
});
