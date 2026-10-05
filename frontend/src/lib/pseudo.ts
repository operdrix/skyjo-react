import * as yup from "yup";

// Mêmes règles que le serveur (backend/src/auth.ts) : 3 à 30 caractères,
// lettres (accents compris), chiffres, espace, point, tiret, souligné
export const PSEUDO_PATTERN = /^[\p{L}\p{N} ._-]+$/u;
export const PSEUDO_MIN = 3;
export const PSEUDO_MAX = 30;

// Champ pseudo des formulaires (inscription, choix après Google, changement)
export const pseudoSchema = yup
  .string()
  .trim()
  .min(PSEUDO_MIN, `${PSEUDO_MIN} caractères minimum`)
  .max(PSEUDO_MAX, `${PSEUDO_MAX} caractères maximum`)
  .matches(PSEUDO_PATTERN, "Lettres, chiffres, espace, point ou tiret uniquement")
  .required("Le pseudo est requis");

// Pseudo proposé à partir du prénom Google (vide s'il n'en reste rien d'utilisable)
export function suggestPseudo(name: string | null | undefined): string {
  const pseudo = (name ?? "")
    .replace(/[^\p{L}\p{N} ._-]/gu, "")
    .trim()
    .slice(0, PSEUDO_MAX);
  return pseudo.length >= PSEUDO_MIN ? pseudo : "";
}

const GUEST_ANIMALS = [
  "Lynx",
  "Renard",
  "Hibou",
  "Loutre",
  "Panda",
  "Koala",
  "Castor",
  "Faucon",
  "Dauphin",
  "Écureuil",
];

// Pseudo proposé à un invité : un animal et un nombre (ex. « Lynx 42 »), `random` injectable pour les tests
export function guestPseudo(random = Math.random): string {
  const animal = GUEST_ANIMALS[Math.floor(random() * GUEST_ANIMALS.length)];
  const number = 1 + Math.floor(random() * 99);
  return `${animal} ${number}`;
}
