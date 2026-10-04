// Tranches de valeur des cartes : une couleur (définie par le thème) et un symbole,
// pour rester lisible sans distinguer les couleurs (voir docs/DESIGN.md).
export type CardTier = "neg" | "zero" | "low" | "mid" | "high";

export function cardTier(value: number): { tier: CardTier; symbol: string } {
  if (value < 0) return { tier: "neg", symbol: "◆" };
  if (value === 0) return { tier: "zero", symbol: "●" };
  if (value <= 4) return { tier: "low", symbol: "▲" };
  if (value <= 8) return { tier: "mid", symbol: "■" };
  return { tier: "high", symbol: "✱" };
}
