import PlayingCard from "@/components/PlayingCard";
import { THEME_STYLES, type ThemeStyle } from "@/lib/theme";
import { useId } from "react";

const LABELS: Record<ThemeStyle, string> = {
  tapis: "Tapis de jeu",
  neon: "Soirée néon",
  confettis: "Confettis",
};

// Choix du thème d'affichage : chaque vignette est rendue dans son propre thème (aperçu réel)
const ThemePicker = ({
  value,
  onChange,
  label = "Ton thème",
}: {
  value: ThemeStyle;
  onChange: (style: ThemeStyle) => void;
  label?: string;
}) => {
  const labelId = useId();
  return (
    <div>
      <p id={labelId} className="mb-2 text-sm font-bold">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-3 gap-2">
        {THEME_STYLES.map((style) => {
          const checked = style === value;
          return (
            <button
              key={style}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(style)}
              className={`flex flex-col items-center gap-2 rounded-field border-2 bg-base-100 p-2 text-sm font-bold transition-colors ${
                checked ? "border-primary outline-3 outline-offset-1 outline-primary/30" : "hover:border-primary/60"
              }`}
            >
              <span
                data-theme={style}
                data-style={style}
                aria-hidden="true"
                className="flex h-16 w-full items-center justify-center gap-1.5 rounded-lg [background:var(--page-bg)] [--card-w:26px]"
              >
                <PlayingCard />
                <PlayingCard value={style === "confettis" ? 3 : -2} />
              </span>
              {LABELS[style]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemePicker;
