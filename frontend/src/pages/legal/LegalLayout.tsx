import { LAST_UPDATE } from "@/pages/legal/legal";
import { NavLink } from "react-router";

type Props = { title: string; children: React.ReactNode };

const PAGES = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/privacy", label: "Confidentialité" },
  { to: "/cgu", label: "Conditions d'utilisation" },
  { to: "/cookies", label: "Cookies" },
];

// Mise en page commune des pages légales : navigation entre pages + texte à largeur de lecture
export const LegalLayout = ({ title, children }: Props) => (
  <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
    <nav aria-label="Pages légales" className="flex flex-wrap gap-2 md:sticky md:top-6 md:flex-col md:self-start">
      {PAGES.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `rounded-field px-3 py-2 text-sm font-semibold ${isActive ? "bg-base-200 text-base-content" : "text-muted hover:bg-base-200"}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
    <article className="panel max-w-[68ch] space-y-6 p-6 sm:p-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="text-sm text-muted">Dernière mise à jour : {LAST_UPDATE}</p>
      </header>
      {children}
    </article>
  </div>
);

export const Section = ({ title, children }: Props) => (
  <section className="space-y-2">
    <h2 className="text-xl font-semibold">{title}</h2>
    {children}
  </section>
);

export const MailLink = ({ email }: { email: string }) => (
  <a href={`mailto:${email}`} className="link">
    {email}
  </a>
);
