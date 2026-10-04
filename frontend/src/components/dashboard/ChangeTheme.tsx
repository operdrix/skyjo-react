import ThemePicker from "@/components/ThemePicker";
import { authClient } from "@/lib/authClient";
import { readThemePrefs, setThemeStyle, type ThemeStyle } from "@/lib/theme";
import { useState } from "react";

// Thème d'affichage du compte : appliqué tout de suite, enregistré pour les autres appareils
export default function ChangeTheme() {
  const [theme, setTheme] = useState<ThemeStyle>(() => readThemePrefs(localStorage).style);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (style: ThemeStyle) => {
    const previous = theme;
    setError(null);
    setTheme(style);
    setThemeStyle(style);
    const { error } = await authClient.updateUser({ theme: style });
    if (error) {
      setTheme(previous);
      setThemeStyle(previous);
      setError("Le thème n'a pas pu être enregistré, réessayez plus tard.");
    }
  };

  return (
    <section className="panel mt-6 w-full max-w-xl space-y-3 p-5">
      <h2 className="text-lg font-bold">Mon thème</h2>
      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <ThemePicker value={theme} onChange={handleChange} label="Choisis l'ambiance de tes parties" />
    </section>
  );
}
