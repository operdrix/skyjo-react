// Messages en français pour les codes d'erreur de Better Auth
const MESSAGES: Record<string, string> = {
  USERNAME_IS_ALREADY_TAKEN: 'Ce pseudo est déjà pris',
  USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER: 'Ce pseudo est déjà pris',
  INVALID_USERNAME: 'Pseudo invalide (lettres, chiffres, espace, point, tiret)',
  USERNAME_TOO_SHORT: 'Pseudo trop court (3 caractères minimum)',
  USERNAME_TOO_LONG: 'Pseudo trop long (30 caractères maximum)',
  USER_ALREADY_EXISTS: 'Un compte existe déjà avec cet email',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Un compte existe déjà avec cet email',
  INVALID_EMAIL_OR_PASSWORD: 'Email ou mot de passe incorrect',
  PASSWORD_TOO_SHORT: 'Mot de passe trop court (8 caractères minimum)',
  INVALID_TOKEN: 'Lien expiré ou invalide, refaites une demande',
};

export function authErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  return (error?.code && MESSAGES[error.code]) || error?.message || 'Une erreur est survenue';
}
