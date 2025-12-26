import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "semi": ["warn", "always"],
      "indent": ["off", 2],
      "quotes": ["warn", "double", { avoidEscape: true }],
      "no-console": "off" // Permettre console.log pour le développement
    }
  }
]; 