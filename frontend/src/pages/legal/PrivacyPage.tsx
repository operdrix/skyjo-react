import { LegalLayout, MailLink, Section } from "@/pages/legal/LegalLayout";
import { CONTACT_EMAIL, CONTROLLER, HOST, SITE_NAME } from "@/pages/legal/legal";
import { Link } from "react-router";

const PrivacyPage = () => (
  <LegalLayout title="Politique de confidentialité">
    <p>
      {SITE_NAME} est un jeu gratuit, sans publicité ni mesure d'audience. Nous ne collectons que le strict nécessaire
      pour vous permettre de jouer, et vos données ne sont jamais vendues ni utilisées à des fins commerciales.
    </p>

    <Section title="1. Responsable du traitement">
      <p>
        {CONTROLLER}, particulier, éditeur du site. Contact : <MailLink email={CONTACT_EMAIL} />
      </p>
    </Section>

    <Section title="2. Données traitées, finalités et bases légales">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Données</th>
              <th>Pourquoi</th>
              <th>Base légale (RGPD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pseudo, adresse email, mot de passe (stocké uniquement sous forme hachée, illisible)</td>
              <td>Créer votre compte, vous connecter, réinitialiser votre mot de passe</td>
              <td>Exécution des conditions d'utilisation (art. 6.1.b)</td>
            </tr>
            <tr>
              <td>
                Avec « Continuer avec Google » : email, prénom et jetons de connexion transmis par Google (votre photo
                n'est pas conservée)
              </td>
              <td>Vous connecter sans mot de passe ; le prénom sert à vous proposer un pseudo</td>
              <td>Exécution des conditions d'utilisation (art. 6.1.b)</td>
            </tr>
            <tr>
              <td>Parties jouées, scores, meilleur score</td>
              <td>Faire fonctionner le jeu, afficher votre historique et vos statistiques</td>
              <td>Exécution des conditions d'utilisation (art. 6.1.b)</td>
            </tr>
            <tr>
              <td>Thème d'affichage choisi (Tapis de jeu, Soirée néon ou Confettis)</td>
              <td>Retrouver la même ambiance sur tous vos appareils</td>
              <td>Exécution des conditions d'utilisation (art. 6.1.b)</td>
            </tr>
            <tr>
              <td>Session de connexion : adresse IP, navigateur utilisé, dates de connexion</td>
              <td>Vous garder connecté, sécuriser les comptes, supprimer les comptes inactifs</td>
              <td>Intérêt légitime : sécurité du service (art. 6.1.f)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Votre pseudo et vos scores sont visibles des autres joueurs. Votre adresse email n'est jamais affichée ni
        communiquée aux autres joueurs.
      </p>
    </Section>

    <Section title="3. Destinataires et sous-traitants">
      <p>Vos données ne sont accessibles qu'à l'éditeur et aux prestataires techniques suivants :</p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          {HOST.name} : hébergement du site et de la base de données, sur un serveur situé en {HOST.serverLocation}.
        </li>
        <li>
          Google : uniquement si vous choisissez « Continuer avec Google » (Google applique alors sa propre politique de
          confidentialité), et pour l'envoi des emails de réinitialisation de mot de passe (Gmail). Google LLC est
          établie aux États-Unis ; ce transfert est encadré par le Data Privacy Framework UE–États-Unis (décision
          d'adéquation de la Commission européenne du 10 juillet 2023).
        </li>
      </ul>
    </Section>

    <Section title="4. Durées de conservation">
      <ul className="list-disc list-inside space-y-1">
        <li>
          Compte et historique de jeu : tant que vous utilisez le site. Un compte sans aucune connexion pendant 3 ans
          est supprimé automatiquement, avec ses données.
        </li>
        <li>
          Session de connexion (adresse IP, navigateur) : 7 jours après votre dernière visite, puis suppression
          automatique.
        </li>
        <li>Lien de réinitialisation de mot de passe : 1 heure.</li>
        <li>
          Quand un compte est supprimé, les parties qu'il a créées sont supprimées, et il est retiré des parties créées
          par d'autres joueurs.
        </li>
      </ul>
    </Section>

    <Section title="5. Vos droits">
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition
        sur vos données, ainsi que du droit de définir des directives sur leur sort après votre décès.
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          Supprimer votre compte : bouton « Supprimer mon compte » de votre{" "}
          <Link to="/dashboard" className="link">
            tableau de bord
          </Link>{" "}
          (immédiat et définitif).
        </li>
        <li>
          Toute autre demande : <MailLink email={CONTACT_EMAIL} />. Nous répondons dans un délai d'un mois.
        </li>
      </ul>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (
        <a href="https://www.cnil.fr/fr/plaintes" className="link">
          www.cnil.fr
        </a>
        , 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07).
      </p>
    </Section>

    <Section title="6. Sécurité">
      <p>
        Le site est servi exclusivement en HTTPS. Les mots de passe sont hachés, le cookie de session n'est pas lisible
        par les scripts de la page, et l'accès au serveur et à la base de données est restreint à l'éditeur.
      </p>
    </Section>

    <Section title="7. Mineurs">
      <p>
        Le jeu est ouvert à tous. Si vous avez moins de 15 ans, demandez l'accord d'un parent avant de créer un compte.
      </p>
    </Section>

    <Section title="8. Cookies">
      <p>
        Le site n'utilise que des traceurs indispensables à son fonctionnement : voir la{" "}
        <Link to="/cookies" className="link">
          page cookies
        </Link>
        .
      </p>
    </Section>

    <Section title="9. Modifications">
      <p>
        Cette politique peut évoluer. La date de dernière mise à jour figure en haut de la page ; en cas de changement
        important, vous en serez informé sur le site.
      </p>
    </Section>
  </LegalLayout>
);

export default PrivacyPage;
