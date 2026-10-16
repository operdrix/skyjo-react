// Aide de jeu de Banco, rédigée pour le site
const BancoRules = () => (
  <div className="mx-auto max-w-3xl space-y-3 p-4">
    <h1 className="mb-2 text-center text-2xl font-bold">Règles de Banco</h1>
    <p>
      Chaque manche, chacun reçoit une carte. À ton tour, choisis : <strong>Encore</strong> pour prendre une carte de
      plus, ou <strong>Stop</strong> pour mettre tes points à l'abri jusqu'à la fin de la manche.
    </p>
    <p>
      Attention aux doublons : si tu tires un nombre que tu as déjà devant toi, tu es éliminé de la manche et tu marques
      0.
    </p>
    <p>
      Réunis 7 nombres différents et tu gagnes 15 points de bonus ; la manche s'arrête aussitôt. Sinon, elle se termine
      quand plus personne n'est en jeu.
    </p>
    <p>
      Les modificateurs (+2, +4, +6, +8, +10 et ×2) se posent à côté de tes nombres. Ils ne comptent jamais comme un
      doublon. Le ×2 double la somme de tes nombres, puis les + s'ajoutent. Un joueur éliminé marque 0, modificateurs
      compris.
    </p>
    <p>
      Trois cartes action se cachent aussi dans la pioche. Quand tu en tires une, tu choisis qui la reçoit parmi les
      joueurs encore en jeu, toi compris (si tu es seul en jeu, elle est pour toi) :
    </p>
    <ul className="list-disc space-y-1 pl-6">
      <li>
        <strong>Gel</strong> : le joueur visé s'arrête tout de suite et garde ses points.
      </li>
      <li>
        <strong>Trois d'un coup</strong> : le joueur visé prend 3 cartes, l'une après l'autre. Il s'arrête plus tôt s'il
        tombe sur un doublon ou réunit 7 nombres. Les actions qu'il tire pendant ce temps sont jouées après les 3
        cartes.
      </li>
      <li>
        <strong>Seconde chance</strong> : garde-la devant toi, elle te sauve de ton prochain doublon (les deux cartes
        partent alors à la défausse). Si tu en as déjà une, tu offres la nouvelle à un autre joueur en jeu qui n'en a
        pas ; sinon, elle part à la défausse.
      </li>
    </ul>
    <p>La pioche continue d'une manche à l'autre. Quand elle est vide, la défausse est mélangée pour la reformer.</p>
    <p>
      Tu marques la somme de tes cartes. Le premier joueur change à chaque manche. Dès qu'un joueur atteint 200 points
      en fin de manche, la partie s'arrête : le plus haut total gagne.
    </p>
  </div>
);

export default BancoRules;
