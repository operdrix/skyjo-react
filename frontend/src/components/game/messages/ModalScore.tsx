import ScoreTable from "@/components/game/ScoreTable";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";

// Tableau des scores en cours de partie (bouton de la barre d'outils) : panneau du bas sur mobile
const ModalScore = () => {
  const { game } = useGame();
  const { userId } = useUser();

  if (!game) return null;
  return (
    <dialog id="modal-score" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2" aria-label="Fermer">
            ✕
          </button>
        </form>
        <h3 className="mb-3 text-xl font-bold">Scores · Manche {game.roundNumber}</h3>
        <div className="overflow-x-auto">
          <ScoreTable players={game.players} userId={userId} />
        </div>
        <p className="mt-3 text-xs text-muted">
          Le plus petit total gagne. La partie s'arrête quand un joueur atteint 100.
        </p>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Fermer</button>
      </form>
    </dialog>
  );
};

export default ModalScore;
