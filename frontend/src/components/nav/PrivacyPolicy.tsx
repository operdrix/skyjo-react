const PrivacyPolicy = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200 p-4">
      <div className="max-w-3xl w-full bg-white shadow-xl rounded-xl p-6 space-y-4">
        <h1 className="text-3xl font-bold text-primary text-center">Politique de Confidentialité</h1>
        <p className="text-gray-600 text-center">Dernière mise à jour : 03/10/2026</p>

        <div className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold text-secondary">1. Cookies et stockage sur votre appareil</h2>
            <p>Skyjo d’Olivier n’utilise ni publicité ni mesure d’audience. Seuls sont utilisés :</p>
            <ul className="list-disc list-inside mt-2">
              <li>Un cookie de session, indispensable pour rester connecté (supprimé à la déconnexion).</li>
              <li>Vos préférences de jeu (thème clair/sombre, son), gardées dans votre navigateur.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">2. Données stockées sur notre serveur</h2>
            <p>Nous ne demandons que le strict nécessaire pour jouer :</p>
            <ul className="list-disc list-inside mt-2">
              <li>Votre pseudo, visible des autres joueurs.</li>
              <li>
                Votre adresse email, jamais affichée : elle sert à vous connecter et à réinitialiser votre mot de passe.
              </li>
              <li>Votre mot de passe, uniquement sous forme chiffrée (si vous ne passez pas par Google).</li>
              <li>L’historique et les scores de vos parties.</li>
            </ul>
            <p className="mt-2">
              Avec « Continuer avec Google », Google nous transmet votre email et votre prénom (qui sert seulement à
              vous proposer un pseudo). Votre photo n’est pas conservée.
            </p>
            <p className="mt-2">Ces informations restent confidentielles et ne sont pas partagées avec des tiers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">3. Suppression des données</h2>
            <p>
              Actuellement, il n’existe pas encore d’option pour supprimer un compte ou réinitialiser les données. Cette
              fonctionnalité sera ajoutée prochainement.
            </p>
            <p>Vous pouvez cependant nous contacter pour toute demande de suppression :</p>
            <p className="mt-2 font-semibold text-primary">
              📧{" "}
              <a href="mailto:olivierperdrix@live.fr" className="underline">
                olivierperdrix@live.fr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">4. Sécurité</h2>
            <p>
              Nous protégeons vos données contre tout accès non autorisé. Cependant, nous vous recommandons d’utiliser
              un mot de passe sécurisé pour votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">5. Modifications</h2>
            <p>Cette politique pourra être mise à jour. Nous vous informerons de tout changement important.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">6. Contact</h2>
            <p>Si vous avez des questions, contactez-nous :</p>
            <p className="mt-2 font-semibold text-primary">
              📧{" "}
              <a href="mailto:olivierperdrix@live.fr" className="underline">
                olivierperdrix@live.fr
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
