import { Link } from "react-router";

const LINKS = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/privacy", label: "Confidentialité" },
  { to: "/cgu", label: "Conditions d'utilisation" },
  { to: "/cookies", label: "Cookies" },
];

const Footer = () => {
  // Version figée au build par la CI de release (tag vX.Y.Z), « dev » sinon
  const release = import.meta.env.VITE_APP_VERSION;
  const appVersion = release ? `v${release}` : "dev";
  return (
    <footer className="mx-auto mt-10 flex w-full max-w-6xl flex-col gap-4 border-t border-dashed px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>
        <span className="font-display font-semibold text-base-content">Skyjo d'Olivier</span> · jeu gratuit entre amis,
        sans publicité
      </p>
      <nav aria-label="Informations légales" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className="link link-hover">
            {label}
          </Link>
        ))}
        <span className="tabular-nums">{appVersion}</span>
      </nav>
    </footer>
  );
};

export default Footer;
