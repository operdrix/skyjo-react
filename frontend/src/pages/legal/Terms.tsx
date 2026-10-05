import { LegalLayout, MailLink, Section } from "@/pages/legal/LegalLayout";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/pages/legal/legal";
import { Link } from "react-router";

const Terms = () => (
  <LegalLayout title="Conditions générales d'utilisation">
    <Section title="1. Objet">
      <p>
        Les présentes conditions encadrent l'utilisation de {SITE_NAME} ({SITE_URL}), un site gratuit et sans publicité
        permettant de jouer en ligne au Skyjo entre amis. En créant un compte, vous les acceptez.
      </p>
    </Section>

    <Section title="2. Accès au service">
      <p>
        Le site est proposé gratuitement, par un particulier, sur son temps libre. Il est fourni « en l'état », sans
        garantie de disponibilité : il peut être interrompu, modifié ou arrêté à tout moment, notamment pour
        maintenance, et les parties en cours peuvent alors être perdues.
      </p>
    </Section>

    <Section title="3. Compte et pseudo">
      <ul className="list-disc list-inside space-y-1">
        <li>Un compte est personnel. Vous êtes responsable de la confidentialité de votre mot de passe.</li>
        <li>
          Vous pouvez rejoindre une partie sans compte, en invité : seul un pseudo est demandé. Un invité ne peut pas
          créer de partie et n'a pas d'historique ; sa place est liée au navigateur utilisé.
        </li>
        <li>
          Votre pseudo est visible des autres joueurs. Il ne doit pas être injurieux, discriminatoire, contraire à la
          loi ni usurper l'identité d'une autre personne.
        </li>
        <li>
          Un compte qui ne respecte pas ces conditions peut être suspendu ou supprimé, après un avertissement par email
          lorsque c'est possible.
        </li>
      </ul>
    </Section>

    <Section title="4. Bonne conduite">
      <p>Vous vous engagez à ne pas :</p>
      <ul className="list-disc list-inside space-y-1">
        <li>tricher ou exploiter un bug pour fausser une partie ;</li>
        <li>perturber le fonctionnement du site (requêtes automatisées, tentatives d'intrusion, surcharge…) ;</li>
        <li>accéder ou tenter d'accéder au compte d'un autre joueur.</li>
      </ul>
    </Section>

    <Section title="5. Propriété intellectuelle">
      <p>
        Skyjo est un jeu de société créé par Alexander Bernhardt et édité par Magilano, titulaire de la marque. Ce site
        est une adaptation amateur, sans lien avec Magilano. Si vous aimez le jeu, achetez la version en boîte !
      </p>
    </Section>

    <Section title="6. Responsabilité">
      <p>
        L'éditeur met en œuvre des moyens raisonnables pour assurer le bon fonctionnement et la sécurité du site, mais
        ne peut être tenu responsable d'une indisponibilité, d'une perte de données de jeu ou d'un usage du site
        contraire aux présentes conditions.
      </p>
    </Section>

    <Section title="7. Données personnelles">
      <p>
        Le traitement de vos données est décrit dans la{" "}
        <Link to="/privacy" className="link">
          politique de confidentialité
        </Link>
        .
      </p>
    </Section>

    <Section title="8. Fin d'utilisation">
      <p>
        Vous pouvez supprimer votre compte à tout moment depuis la page{" "}
        <Link to="/dashboard" className="link">
          Mon espace
        </Link>
        . Un compte sans connexion pendant 3 ans est supprimé automatiquement.
      </p>
    </Section>

    <Section title="9. Modifications">
      <p>
        Ces conditions peuvent évoluer ; la date de dernière mise à jour figure en haut de la page. Continuer à utiliser
        le site après une modification vaut acceptation des nouvelles conditions.
      </p>
    </Section>

    <Section title="10. Droit applicable et contact">
      <p>
        Les présentes conditions sont soumises au droit français. En cas de difficulté, écrivez d'abord à{" "}
        <MailLink email={CONTACT_EMAIL} /> pour trouver une solution amiable.
      </p>
    </Section>
  </LegalLayout>
);

export default Terms;
