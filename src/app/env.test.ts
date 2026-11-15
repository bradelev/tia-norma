import { describe, expect, it } from "vitest";
import { supabaseEnv, whatsappEnv } from "./env";

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

describe("variables de WhatsApp", () => {
  const whatsapp = {
    WHATSAPP_TOKEN: "token-de-prueba",
    WHATSAPP_PHONE_NUMBER_ID: "100000000000001",
    WHATSAPP_APP_SECRET: "secreto-de-prueba",
    WHATSAPP_VERIFY_TOKEN: "token-de-verificacion",
    AUTHORIZED_NUMBERS: "+54 9 11 0000-0000, 5491100000001",
  };

  it("lee los autorizados como los manda WhatsApp, solo dígitos", () => {
    expect(whatsappEnv(whatsapp).AUTHORIZED_NUMBERS).toEqual([
      "5491100000000",
      "5491100000001",
    ]);
  });

  it("sin autorizados, falla al arrancar", () => {
    expect(() =>
      whatsappEnv({ ...whatsapp, AUTHORIZED_NUMBERS: " , " }),
    ).toThrow();
  });
});
