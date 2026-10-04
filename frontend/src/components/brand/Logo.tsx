import { Link } from "react-router";

// Logo : une carte inclinée + le nom du jeu
const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2.5 font-display text-xl font-bold ${className}`}>
    <span
      aria-hidden="true"
      className="grid h-9 w-7 -rotate-8 place-items-center rounded-[7px] border-2 border-line bg-primary text-base text-primary-content"
    >
      S
    </span>
    Skyjo d'Olivier
  </Link>
);

export default Logo;
