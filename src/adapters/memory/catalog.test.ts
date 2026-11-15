import { describe } from "vitest";
import { catalogContract } from "../catalog.contract";
import { createMemoryCatalog } from "./catalog";

describe("catálogo en memoria", () => catalogContract(createMemoryCatalog));
