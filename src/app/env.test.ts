import { describe, expect, it } from "vitest";
import { supabaseEnv } from "./env";

const complete = {
  SUPABASE_URL: "https://ejemplo.supabase.co",
  SUPABASE_SECRET_KEY: "clave-de-prueba",
  DATABASE_URL: "postgresql://usuario:clave@localhost:6543/postgres",
};

describe("variables de entorno", () => {
  it("sin ninguna, la página usa las piezas de muestra", () => {
    expect(supabaseEnv({})).toBeNull();
  });

  it("con todas, conecta con Supabase", () => {
    expect(supabaseEnv(complete)).toEqual(complete);
  });

  it("a medias, falla al arrancar", () => {
    expect(() => supabaseEnv({ ...complete, DATABASE_URL: "" })).toThrow();
  });

  it("en producción no hay piezas de muestra", () => {
    expect(() => supabaseEnv({ VERCEL_ENV: "production" })).toThrow();
  });
});
