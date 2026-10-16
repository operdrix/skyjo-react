import Deck from "@/components/game/Deck";
import Discard from "@/components/game/Discard";
import GameMenu from "@/components/game/GameMenu";
import GameSettings from "@/components/game/GameSettings";
import Instructions from "@/components/game/Instructions";
import PlayerSet from "@/components/game/PlayerSet";
import RoundResults from "@/components/game/RoundResults";
import ModalScore from "@/components/game/messages/ModalScore";
import { tableSeats } from "@/game/seats";
import { isRoundOver } from "@/game/turn";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";

// Table de Colonnes : adversaires autour, pioche et défausse (ou résultats) au centre, le joueur en bas
const ColonnesTable = () => {
  const { game } = useGame();
  const { userId } = useUser();

  if (!game || !userId) return null;
  const roundOver = isRoundOver(game);
  const seats = tableSeats(game.gameData.turnOrder, userId);

  return (
    <>
      <ModalScore />

      <div className="flex h-dvh flex-col">
        {/* Barre d'outils : quitter, scores, règles à gauche ; thème et son à droite */}
        <div className="flex items-center justify-between px-2 pt-2">
          <GameMenu />
          <GameSettings />
        </div>

        <section
          className={`game-area mx-auto w-full max-w-6xl px-2 pb-2 ${game.players.length === 2 ? "game-area-duel" : ""} ${roundOver ? "game-area-results" : ""}`}
        >
          {/* Ligne 1 : joueur d'en face */}
          <div className="game-area-top-center">
            <PlayerSet playerId={seats.top} smallSet={game.players.length > 2} />
          </div>

          {/* Ligne 2 */}

          {/* Joueur à gauche */}
          {game.players.length >= 3 && (
            <div className="game-area-middle-left">
              <PlayerSet playerId={seats.left} smallSet />
            </div>
          )}

          {/* Zone de pioche et défausse */}
          <div className="game-area-middle-center flex flex-col items-center justify-center">
            {roundOver ? (
              <RoundResults />
            ) : (
              <div className="flex items-center justify-center gap-3 md:gap-9">
                {/* Pioche */}
                <Deck />

                {/* Défausse */}
                <Discard />
              </div>
            )}
          </div>

          {/* Joueur à droite */}
          {game.players.length === 4 && (
            <div className="game-area-middle-right">
              <PlayerSet playerId={seats.right} smallSet />
            </div>
          )}
          {/* Ligne 3 : jour actuel */}
          <div className="game-area-bottom-center">
            <PlayerSet playerId={userId} isCurrentPlayerSet />
          </div>

          {/* Bandeau du bas : consigne en cours */}
          {!roundOver && (
            <div className="game-area-hint">
              <div className="game-hint" role="status">
                <Instructions />
                {game.gameData.lastTurn && (
                  <span className="badge badge-warning shrink-0 font-bold">Dernier tour !</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default ColonnesTable;
