export type Seats = { top: string; left: string; right: string };

// Places des adversaires autour de la table, dans l'ordre du tour à partir du joueur :
// à 2, l'adversaire est en face ; à 3, gauche puis face ; à 4, gauche, face, droite
export function tableSeats(turnOrder: string[], userId: string): Seats {
  const seats: Seats = { top: "", left: "", right: "" };
  const count = turnOrder.length;
  const order: (keyof Seats)[] = count === 4 ? ["left", "top", "right"] : count === 3 ? ["left", "top"] : ["top"];
  const start = turnOrder.indexOf(userId);

  order.forEach((seat, index) => {
    if (count > index + 1) {
      seats[seat] = turnOrder[(start + index + 1) % count];
    }
  });
  return seats;
}
