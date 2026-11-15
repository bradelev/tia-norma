import { describe } from "vitest";
import { catalogContract } from "../catalog.contract";
import { createPostgresCatalog } from "./catalog";

describe("catálogo en Postgres", () =>
  catalogContract(() => createPostgresCatalog(process.env.DATABASE_URL ?? "")));
