import { describe, expect, it } from "vitest";
import { nextMode, readThemePrefs, resolveTheme, writeThemePrefs } from "@/lib/theme";

// Stockage en mémoire, au format de localStorage
const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    dump: () => Object.fromEntries(data),
  };
};

const brokenStorage = {
  getItem: () => {
    throw new Error("bloqué");
  },
  setItem: () => {
    throw new Error("bloqué");
  },
  removeItem: () => {
    throw new Error("bloqué");
  },
};

describe("resolveTheme", () => {
  it("donne le thème clair en mode clair", () => {
    expect(resolveTheme({ style: "tapis", mode: "clair" }, true)).toBe("tapis");
  });

  it("donne la variante sombre en mode sombre", () => {
    expect(resolveTheme({ style: "tapis", mode: "sombre" }, false)).toBe("tapis-sombre");
  });

  it("garde Soirée néon en sombre quel que soit le mode", () => {
    expect(resolveTheme({ style: "neon", mode: "clair" }, false)).toBe("neon");
    expect(resolveTheme({ style: "neon", mode: "sombre" }, false)).toBe("neon");
    expect(resolveTheme({ style: "neon", mode: "auto" }, true)).toBe("neon");
  });

  it("suit la préférence du système en mode auto", () => {
    expect(resolveTheme({ style: "tapis", mode: "auto" }, true)).toBe("tapis-sombre");
    expect(resolveTheme({ style: "tapis", mode: "auto" }, false)).toBe("tapis");
  });
});

describe("readThemePrefs", () => {
  it("renvoie Tapis de jeu en mode auto par défaut", () => {
    expect(readThemePrefs(memoryStorage())).toEqual({ style: "tapis", mode: "auto" });
  });

  it("relit les préférences enregistrées", () => {
    const storage = memoryStorage({ "theme-style": "tapis", "theme-mode": "sombre" });
    expect(readThemePrefs(storage)).toEqual({ style: "tapis", mode: "sombre" });
  });

  it("reprend l'ancien réglage clair/sombre", () => {
    expect(readThemePrefs(memoryStorage({ theme: "dark" }))).toEqual({ style: "tapis", mode: "sombre" });
    expect(readThemePrefs(memoryStorage({ theme: "light" }))).toEqual({ style: "tapis", mode: "clair" });
  });

  it("accepte le thème Confettis", () => {
    const storage = memoryStorage({ "theme-style": "confettis", "theme-mode": "sombre" });
    const prefs = readThemePrefs(storage);
    expect(prefs).toEqual({ style: "confettis", mode: "sombre" });
    expect(resolveTheme(prefs, false)).toBe("confettis-sombre");
  });

  it("ignore les valeurs inconnues", () => {
    const storage = memoryStorage({ "theme-style": "cupcake", "theme-mode": "violet" });
    expect(readThemePrefs(storage)).toEqual({ style: "tapis", mode: "auto" });
  });

  it("résiste à un stockage inaccessible", () => {
    expect(readThemePrefs(brokenStorage)).toEqual({ style: "tapis", mode: "auto" });
  });
});

describe("writeThemePrefs", () => {
  it("enregistre les préférences et retire l'ancienne clé", () => {
    const storage = memoryStorage({ theme: "dark" });
    writeThemePrefs(storage, { style: "tapis", mode: "clair" });
    expect(storage.dump()).toEqual({ "theme-style": "tapis", "theme-mode": "clair" });
  });

  it("résiste à un stockage inaccessible", () => {
    expect(() => writeThemePrefs(brokenStorage, { style: "tapis", mode: "clair" })).not.toThrow();
  });
});

describe("nextMode", () => {
  it("passe de clair à sombre, puis auto, puis clair", () => {
    expect(nextMode("clair")).toBe("sombre");
    expect(nextMode("sombre")).toBe("auto");
    expect(nextMode("auto")).toBe("clair");
  });
});
