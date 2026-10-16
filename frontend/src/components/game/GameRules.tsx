import BancoRules from "@/components/banco/BancoRules";
import Rules from "@/components/game/Rules";
import type { GameKind } from "@/types/types";

// Règles du jeu de la partie (Colonnes par défaut)
export default function GameRules({ kind }: { kind?: GameKind }) {
  return kind === "banco" ? <BancoRules /> : <Rules />;
}
