import { applyTheme, nextMode, readThemePrefs, ThemeMode, ThemePrefs, writeThemePrefs } from "@/lib/theme";
import { useEffect, useState } from "react";

const LABELS: Record<ThemeMode, string> = {
  clair: "Mode clair",
  sombre: "Mode sombre",
  auto: "Mode automatique",
};

// Bascule clair → sombre → auto (suit le système)
const ToggleTheme = ({ className = "" }: { className?: string }) => {
  const [prefs, setPrefs] = useState<ThemePrefs>(() => readThemePrefs(localStorage));

  useEffect(() => {
    applyTheme(prefs);
    if (prefs.mode !== "auto" || !window.matchMedia) return;
    // En mode auto, suivre les changements du système
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(prefs);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [prefs]);

  const handleClick = () => {
    const updated = { ...prefs, mode: nextMode(prefs.mode) };
    writeThemePrefs(localStorage, updated);
    setPrefs(updated);
  };

  const label = LABELS[prefs.mode];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn btn-ghost btn-square ${className}`}
      aria-label={`${label} (changer)`}
      title={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden="true"
      >
        {prefs.mode === "clair" && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
        {prefs.mode === "sombre" && <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />}
        {prefs.mode === "auto" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" />
          </>
        )}
      </svg>
    </button>
  );
};

export default ToggleTheme;
