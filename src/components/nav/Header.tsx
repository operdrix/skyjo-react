import ToggleTheme from "@/components/nav/ToggleTheme";
import { useUser } from "@/hooks/User";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {

  const { isAuthentified, logout, loading, userName } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  }

  return (
    <header className="navbar bg-base-100">
      <div className="navbar-start">
        <nav className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li><Link to={'/'}>Accueil</Link></li>
            <li>
              <Link to={'/create'}>Jouer</Link>
              <ul className="p-2">
                <li><Link to={'/create'}>Créer partie</Link></li>
                <li><Link to={'/public-rooms'}>Rejoindre partie</Link></li>
              </ul>
            </li>
            {isAuthentified ? (
              <>
                <li><button onClick={handleLogout}>Déconnexion</button></li>
              </>
            ) : (
              <>
                <li><Link to={'/auth/login'}>Connexion</Link></li>
                <li><Link to={'/auth/register'}>Créer un compte</Link></li>
              </>
            )}
            <li><ToggleTheme /></li>
          </ul>
        </nav>
        <Link to={"/"} className="btn btn-ghost text-xl">Skyjo d'Olivier</Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to={'/'}>Accueil</Link></li>
          <li>
            <details>
              <summary>Jouer</summary>
              <ul className="p-2 w-52">
                <li><Link to={'/create'}>Créer une partie</Link></li>
                <li><Link to={'/public-rooms'}>Rejoindre une partie</Link></li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
      <div className="navbar-end gap-2">
        {loading ? (
          <span className="loading loading-ring loading-md"></span>
        ) : (
          isAuthentified ? (
            <>
              <div className="flex justify-center items-center mx-3">Bonjour {userName}</div>
              <button className="btn hidden lg:block" onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to={'/auth/login'} className="btn">Connexion</Link>
              <Link to={'/auth/register'} className="btn hidden lg:flex">Créer un compte</Link>
            </>
          )
        )}
        <div className="hidden lg:flex">
          <ToggleTheme />
        </div>
      </div>
    </header>
  )
}

export default Header