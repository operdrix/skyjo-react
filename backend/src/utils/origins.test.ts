import { describe, expect, it } from "vitest";
import { frontendOrigins } from "./origins.ts";

describe("origines du front autorisées", () => {
  it("lit une liste séparée par des virgules", () => {
    expect(frontendOrigins("https://skyjo.fr, http://localhost:4173")).toEqual([
      "https://skyjo.fr",
      "http://localhost:4173",
    ]);
  });

  it("vaut le front Vite de dev par défaut", () => {
    expect(frontendOrigins(undefined)).toEqual(["http://localhost:5173"]);
    expect(frontendOrigins("")).toEqual(["http://localhost:5173"]);
  });
});
