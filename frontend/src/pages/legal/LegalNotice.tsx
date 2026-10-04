import { LegalLayout, MailLink, Section } from "@/pages/legal/LegalLayout";
import { CONTACT_EMAIL, HOST, SITE_NAME, SITE_URL } from "@/pages/legal/legal";
import { Link } from "react-router";

const LegalNotice = () => (
  <LegalLayout title="Mentions légales">
    <Section title="Éditeur">
      <p>
        Le site {SITE_NAME} ({SITE_URL}) est un projet personnel, gratuit et sans publicité, édité à titre non
        professionnel par un particulier.
      </p>
      <p>
        Conformément à l'article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie
        numérique, l'éditeur ne publie pas ses coordonnées personnelles ; celles-ci ont été communiquées à l'hébergeur.
      </p>
      <p>
        Contact : <MailLink email={CONTACT_EMAIL} />
      </p>
    </Section>

    <Section title="Hébergeur">
      <p>
        {HOST.name}, société de droit chypriote, {HOST.address} —{" "}
        <a href={HOST.url} className="link">
          {HOST.url.replace("https://", "")}
        </a>
        .
      </p>
      <p>
        Hostinger ne publie pas de numéro de téléphone ; il est joignable via son{" "}
        <a href={HOST.contactUrl} className="link">
          formulaire de contact
        </a>
        .
      </p>
      <p>Les données sont hébergées sur un serveur situé en {HOST.serverLocation}.</p>
    </Section>

    <Section title="Propriété intellectuelle">
      <p>
        Skyjo est un jeu de société créé par Alexander Bernhardt et édité par Magilano. Ce site est une adaptation
        réalisée par un amateur pour jouer entre amis ; il n'est ni affilié à Magilano, ni approuvé par cet éditeur.
      </p>
    </Section>

    <Section title="Données personnelles et cookies">
      <p>
        Voir la{" "}
        <Link to="/privacy" className="link">
          politique de confidentialité
        </Link>{" "}
        et la{" "}
        <Link to="/cookies" className="link">
          page cookies
        </Link>
        .
      </p>
    </Section>
  </LegalLayout>
);

export default LegalNotice;
