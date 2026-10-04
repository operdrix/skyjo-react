// Préférences d'affichage : thème (style) choisi par le joueur et mode clair/sombre/auto.
// La copie locale permet d'appliquer le thème avant le rendu React (voir index.html).

export const THEME_STYLES = ["tapis", "neon", "confettis"] as const;
export type ThemeStyle = (typeof THEME_STYLES)[number];

export const THEME_MODES = ["clair", "sombre", "auto"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export type ThemePrefs = { style: ThemeStyle; mode: ThemeMode };
type ThemeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const DEFAULT_THEME_PREFS: ThemePrefs = { style: "tapis", mode: "auto" };

const STYLE_KEY = "theme-style";
const MODE_KEY = "theme-mode";
// Ancienne clé « light » / « dark » d'avant la refonte
const LEGACY_KEY = "theme";

export const isThemeStyle = (value: unknown): value is ThemeStyle => THEME_STYLES.includes(value as ThemeStyle);
const isMode = (value: unknown): value is ThemeMode => THEME_MODES.includes(value as ThemeMode);

// Thèmes sans variante claire : le mode clair/sombre/auto ne s'applique pas
export const isDarkOnly = (style: ThemeStyle) => style === "neon";

// Valeur de data-theme sur <html>
export function resolveTheme(prefs: ThemePrefs, prefersDark: boolean): string {
  if (isDarkOnly(prefs.style)) return prefs.style;
  const dark = prefs.mode === "sombre" || (prefs.mode === "auto" && prefersDark);
  return dark ? `${prefs.style}-sombre` : prefs.style;
}

export function readThemePrefs(storage: ThemeStorage): ThemePrefs {
  try {
    const style = storage.getItem(STYLE_KEY);
    const legacy = storage.getItem(LEGACY_KEY);
    const mode = storage.getItem(MODE_KEY) ?? { dark: "sombre", light: "clair" }[legacy ?? ""];
    return {
      style: isThemeStyle(style) ? style : DEFAULT_THEME_PREFS.style,
      mode: isMode(mode) ? mode : DEFAULT_THEME_PREFS.mode,
    };
  } catch {
    return { ...DEFAULT_THEME_PREFS };
  }
}

export function writeThemePrefs(storage: ThemeStorage, prefs: ThemePrefs): void {
  try {
    storage.setItem(STYLE_KEY, prefs.style);
    storage.setItem(MODE_KEY, prefs.mode);
    storage.removeItem(LEGACY_KEY);
  } catch {
    // Stockage bloqué (navigation privée…) : la préférence vaut pour la session seulement
  }
}

const prefersDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

// Applique le thème sur <html> : data-theme pour les couleurs, data-style pour les effets propres au thème
export function applyTheme(prefs: ThemePrefs, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = resolveTheme(prefs, prefersDark());
  root.dataset.style = prefs.style;
}

export function nextMode(mode: ThemeMode): ThemeMode {
  return THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
}

// Événement émis sur window quand le thème change (ToggleTheme se met à jour)
export const THEME_CHANGE_EVENT = "themechange";

// Change le thème en gardant le mode clair/sombre/auto : copie locale, application, notification
export function setThemeStyle(style: ThemeStyle): void {
  const prefs = { ...readThemePrefs(localStorage), style };
  writeThemePrefs(localStorage, prefs);
  applyTheme(prefs);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
