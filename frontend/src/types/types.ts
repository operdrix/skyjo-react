// Types de partie partagés avec le backend (source unique : shared/types.ts)
import type { GameType, PublicBancoData } from "../../../shared/types";

export type {
  BancoCard,
  BancoStatus,
  Card,
  ErrorType,
  GameData,
  GameKind,
  GameType,
  HiddenCard,
  PublicBancoData,
  ShownCard,
} from "../../../shared/types";

// Partie de Banco telle que diffusée
export type BancoGame = GameType<PublicBancoData>;
