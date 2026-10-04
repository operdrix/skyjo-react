import ThemePicker from "@/components/ThemePicker";
import { setThemeStyle, type ThemeStyle } from "@/lib/theme";
import { useField } from "formik";

// Champ « theme » des formulaires Formik : le thème choisi s'applique tout de suite (aperçu réel)
export default function ThemeField() {
  const [field, , helpers] = useField<ThemeStyle>("theme");
  const handleChange = (style: ThemeStyle) => {
    helpers.setValue(style);
    setThemeStyle(style);
  };
  return (
    <div className="mb-4">
      <ThemePicker value={field.value} onChange={handleChange} label="Ton thème (modifiable plus tard)" />
    </div>
  );
}
