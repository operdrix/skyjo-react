
const Rules = () => {
  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-center text-2xl font-bold mb-4">Règles de Skyjo</h1>

      {/* Objectif du jeu */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Objectif du jeu</h2>
          <p>
            Le but de Skyjo est de terminer la partie avec le score le plus
            faible possible. Les joueurs doivent dévoiler et échanger leurs
            cartes de manière stratégique pour minimiser la somme de leurs
            cartes.<br />
            Le skyjo est composé de cartes de -2 à 12. Il y a 1à cartes de chaque valeur sauf le 0 qui en a 15 et le -2 qui en a 5.
          </p>
        </div>
      </div>

      {/* Début de la partie */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Début de la partie</h2>
          <p>
            Au début de la partie, tous les joueurs doivent retourner deux cartes dans leur jeu.
            Le joueur qui a le plus grand nombre de point commence la partie.<br />
            En cas d'égalité, c'est le joueur qui a la carte la plus forte qui commence.<br />
            En cas d'égalité parfaite, le jeu choisit au hasard le joueur qui commence.
          </p>
        </div>
      </div>

      {/* Déroulement d'un tour */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Déroulement d’un tour</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Choisissez de piocher la première carte de la défausse <span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 inline-block">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </span>
              (face
              visible) OU la première carte de la pioche <span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 inline-block">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                </svg>
              </span> (face cachée).
            </li>
            <li>
              Si vous prenez la carte de la défausse, vous devez obligatoirement
              l’échanger avec une de vos cartes, puis défausser la carte
              échangée.
            </li>
            <li>
              Si vous piochez une carte face cachée :
              <ul className="list-disc list-inside ml-6 space-y-1">
                <li>
                  Vous pouvez la garder et échanger une de vos cartes (cachée ou
                  révélée).
                </li>
                <li>
                  Ou la défausser immédiatement et <strong>révéler</strong> à la
                  place l’une de vos cartes cachées.
                </li>
              </ul>
            </li>
            <li>
              Votre tour se termine, on passe au joueur suivant dans le sens des
              aiguilles d’une montre.
            </li>
          </ol>
        </div>
      </div>

      {/* Règle des colonnes */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Règle des colonnes</h2>
          <p>
            Si vous arrivez à révéler une colonne de trois cartes de la même valeur, elle sera défaussée.<br />
            <strong>Attention</strong> à ne pas faire de colonne de cartes négatives !

          </p>
        </div>
      </div>


      {/* Fin de partie et scoring */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Fin de partie et scoring</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              La fin de la partie est déclenchée lorsqu’un joueur a révélé
              toutes ses cartes. On entre dans le dernier tour.
            </li>
            <li>
              Chaque autre joueur peut alors effectuer <strong>un tour</strong>{" "}
              supplémentaire.
            </li>
            <li>
              Le score de chaque joueur est la somme de ses cartes. Les cartes
              négatives réduisent la somme, les cartes positives l’augmentent.
            </li>
            <li>
              Le joueur avec le total le plus faible gagne la partie.
            </li>
            <li>
              <strong>Attention : </strong> Le joueur qui a révélé toutes ses
              cartes en premier doit avoir le plus petit score. Sinon, son score est doublé.
            </li>
          </ul>
        </div>
      </div>

      {/* Conseils */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Conseils</h2>
          <p>
            Pensez à toujours surveiller les cartes que vous révélez et celles
            de la défausse. Il peut parfois être plus stratégique de retourner
            une de vos cartes plutôt que de prendre la carte piochée !
          </p>
        </div>
      </div>
    </div>
  );
}

export default Rules