import { LAST_UPDATE } from "@/pages/legal/legal";
import { Link } from "react-router";

type Props = { title: string; children: React.ReactNode };

// Mise en page commune des pages légales
export const LegalLayout = ({ title, children }: Props) => (
  <div className="flex justify-center p-4">
    <article className="max-w-3xl w-full bg-base-100 shadow-xl rounded-xl p-6 space-y-6">
      <header className="text-center space-y-1">
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        <p className="text-sm opacity-70">Dernière mise à jour : {LAST_UPDATE}</p>
      </header>
      {children}
      <nav className="flex flex-wrap justify-center gap-4 text-sm pt-4 border-t border-base-300">
        <Link to="/mentions-legales" className="link link-hover">
          Mentions légales
        </Link>
        <Link to="/privacy" className="link link-hover">
          Confidentialité
        </Link>
        <Link to="/cgu" className="link link-hover">
          Conditions d'utilisation
        </Link>
        <Link to="/cookies" className="link link-hover">
          Cookies
        </Link>
      </nav>
    </article>
  </div>
);

export const Section = ({ title, children }: Props) => (
  <section className="space-y-2">
    <h2 className="text-xl font-semibold text-secondary">{title}</h2>
    {children}
  </section>
);

export const MailLink = ({ email }: { email: string }) => (
  <a href={`mailto:${email}`} className="link">
    {email}
  </a>
);
