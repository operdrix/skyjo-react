const PrivacyPolicy = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200 p-4">
      <div className="max-w-3xl w-full bg-white shadow-xl rounded-xl p-6 space-y-4">
        <h1 className="text-3xl font-bold text-primary text-center">Politique de Confidentialité</h1>
        <p className="text-gray-600 text-center">Dernière mise à jour : 31/01/2025</p>

        <div className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold text-secondary">1. Informations stockées</h2>
            <p>Skyjo d’Olivier ne collecte ni n’utilise de cookies. Cependant, certaines données sont stockées localement sur votre appareil :</p>
            <ul className="list-disc list-inside mt-2">
              <li>Jeton d’authentification (JWT) – Pour gérer votre connexion.</li>
              <li>Identifiant utilisateur et nom d’utilisateur.</li>
              <li>Préférences de jeu : thème (clair/sombre) et activation du son.</li>
            </ul>
            <p className="mt-2">Ces informations restent stockées sur votre appareil et ne sont jamais partagées avec des tiers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">2. Données stockées sur notre serveur</h2>
            <p>Nous stockons sur notre serveur :</p>
            <ul className="list-disc list-inside mt-2">
              <li>Votre compte utilisateur (nom d’utilisateur, identifiant).</li>
              <li>L’historique de vos parties.</li>
            </ul>
            <p className="mt-2">Ces informations restent confidentielles et ne sont pas partagées avec des tiers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">3. Suppression des données</h2>
            <p>Actuellement, il n’existe pas encore d’option pour supprimer un compte ou réinitialiser les données. Cette fonctionnalité sera ajoutée prochainement.</p>
            <p>Vous pouvez cependant nous contacter pour toute demande de suppression :</p>
            <p className="mt-2 font-semibold text-primary">📧 <a href="mailto:olivierperdrix@live.fr" className="underline">olivierperdrix@live.fr</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">4. Sécurité</h2>
            <p>Nous protégeons vos données contre tout accès non autorisé. Cependant, nous vous recommandons d’utiliser un mot de passe sécurisé pour votre compte.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">5. Modifications</h2>
            <p>Cette politique pourra être mise à jour. Nous vous informerons de tout changement important.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-secondary">6. Contact</h2>
            <p>Si vous avez des questions, contactez-nous :</p>
            <p className="mt-2 font-semibold text-primary">📧 <a href="mailto:olivierperdrix@live.fr" className="underline">olivierperdrix@live.fr</a></p>
          </section>
        </div>

      </div>
    </div>
  );
}

export default PrivacyPolicy