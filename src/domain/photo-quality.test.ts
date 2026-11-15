import { describe, expect, it } from "vitest";
import { measurePhoto, photoProblem } from "./photo-quality";

describe("medir una foto", () => {
  it("una foto pareja no tiene bordes y su luz es la de sus píxeles", () => {
    const flat = new Uint8Array(16).fill(90);

    expect(measurePhoto(flat, 4)).toEqual({ luminance: 90, sharpness: 0 });
  });

  it("un tablero blanco y negro tiene los bordes más marcados posibles", () => {
    const board = Uint8Array.from({ length: 16 }, (_, i) =>
      (i % 4) % 2 === Math.floor(i / 4) % 2 ? 255 : 0,
    );

    // Inside the 4x4 board, two pixels score -1020 and two +1020.
    expect(measurePhoto(board, 4)).toEqual({
      luminance: 127.5,
      sharpness: 1020 ** 2,
    });
  });
});

describe("juzgar una foto", () => {
  it("una foto con luz y bordes pasa", () => {
    expect(photoProblem({ luminance: 120, sharpness: 300 })).toBeNull();
  });

  it("una foto sin bordes salió movida", () => {
    expect(photoProblem({ luminance: 120, sharpness: 20 })).toBe("blurry");
  });

  it("una foto oscura se rechaza por oscura aunque también esté movida", () => {
    expect(photoProblem({ luminance: 30, sharpness: 20 })).toBe("dark");
  });
});
