import { LegalLayout, Section } from "@/pages/legal/LegalLayout";
import { SITE_NAME } from "@/pages/legal/legal";

const Cookies = () => (
  <LegalLayout title="Cookies et traceurs">
    <p>
      {SITE_NAME} n'utilise ni publicité, ni mesure d'audience, ni bouton de réseau social, ni aucun traceur tiers. Les
      seuls cookies et données stockées dans votre navigateur sont indispensables au fonctionnement du site ou
      mémorisent vos réglages : ils sont exemptés de consentement (article 82 de la loi Informatique et Libertés et
      lignes directrices de la CNIL). C'est pourquoi aucun bandeau ne vous demande votre accord.
    </p>

    <Section title="Liste des traceurs">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Rôle</th>
              <th>Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>better-auth.session_token</td>
              <td>Cookie (site de l'API)</td>
              <td>Vous garder connecté. Illisible par les scripts de la page.</td>
              <td>7 jours après votre dernière visite, supprimé à la déconnexion</td>
            </tr>
            <tr>
              <td>better-auth.state</td>
              <td>Cookie (site de l'API)</td>
              <td>Sécuriser l'échange avec Google, seulement si vous utilisez « Continuer avec Google »</td>
              <td>5 minutes</td>
            </tr>
            <tr>
              <td>theme</td>
              <td>Stockage local du navigateur</td>
              <td>Mémoriser le thème clair ou sombre choisi</td>
              <td>Jusqu'à ce que vous l'effaciez</td>
            </tr>
            <tr>
              <td>sound</td>
              <td>Stockage local du navigateur</td>
              <td>Mémoriser l'activation du son</td>
              <td>Jusqu'à ce que vous l'effaciez</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm opacity-80">
        En production, le nom du cookie de session est précédé de « __Secure- » (cookie réservé aux connexions HTTPS).
      </p>
    </Section>

    <Section title="Google">
      <p>
        Si vous cliquez sur « Continuer avec Google », vous êtes redirigé vers une page de Google, qui dépose ses
        propres cookies selon sa politique. Rien n'est chargé depuis Google tant que vous ne cliquez pas sur ce bouton.
      </p>
    </Section>

    <Section title="Les supprimer">
      <p>
        Vous pouvez effacer ces données à tout moment depuis les réglages de votre navigateur (cookies et données de
        site). Supprimer le cookie de session vous déconnecte ; supprimer les réglages remet le thème et le son par
        défaut.
      </p>
    </Section>
  </LegalLayout>
);

export default Cookies;
