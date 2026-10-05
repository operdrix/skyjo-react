import Logo from "@/components/brand/Logo";
import ToggleTheme from "@/components/nav/ToggleTheme";
import { useUser } from "@/hooks/User";
import { Link, NavLink, useNavigate } from "react-router";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-field px-3 py-2 font-semibold transition-colors hover:bg-base-200 ${isActive ? "bg-base-200" : ""}`;

const Header = () => {
  const { isAuthentified, isGuest, logout, loading, userName } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
      <div className="flex items-center gap-1">
        <label htmlFor="my-drawer" aria-label="Ouvrir le menu" className="btn btn-square btn-ghost lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="size-6 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </label>
        <Logo />
      </div>
      <nav className="hidden items-center gap-1 lg:flex">
        <NavLink to="/rules" className={navLinkClass}>
          Règles
        </NavLink>
        <NavLink to="/public-rooms" className={navLinkClass}>
          Parties publiques
        </NavLink>
        {isAuthentified &&
          (isGuest ? (
            <NavLink to="/auth/register" className={navLinkClass}>
              Créer mon compte
            </NavLink>
          ) : (
            <NavLink to="/dashboard" className={navLinkClass}>
              Mon espace
            </NavLink>
          ))}
      </nav>
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="loading loading-dots loading-md"></span>
        ) : isAuthentified ? (
          <>
            <span className="hidden font-semibold sm:inline">Salut {userName} !</span>
            <button className="btn btn-sm hidden lg:inline-flex" onClick={handleLogout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/login" className="btn btn-primary btn-sm">
              Connexion
            </Link>
            <Link to="/auth/register" className="btn btn-sm hidden lg:inline-flex">
              Créer un compte
            </Link>
          </>
        )}
        <ToggleTheme className="hidden lg:inline-flex" />
      </div>
    </header>
  );
};

export default Header;
