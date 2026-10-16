// Aide de jeu de Banco, rédigée pour le site (version courte, nombres et modificateurs)
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
      Tu marques la somme de tes cartes. Le premier joueur change à chaque manche. Dès qu'un joueur atteint 200 points
      en fin de manche, la partie s'arrête : le plus haut total gagne.
    </p>
  </div>
);

export default BancoRules;
