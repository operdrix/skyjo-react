import { useUser } from "@/hooks/User";
import { Link, useNavigate } from "react-router-dom";
import ToggleTheme from "./nav/ToggleTheme";

const Drawer = ({ children }: {
  children: React.ReactNode
}) => {

  const { isAuthentified, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  }

  return (
    <div className="drawer">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">

        {children}
      </div>
      <div className="drawer-side drawer-open">
        <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        {/* <ul className="menu bg-base-200 min-h-full w-80 p-4"> */}
        <ul
          tabIndex={0}
          className="menu bg-base-100 min-h-full w-80 p-4">
          <li>
            <label htmlFor="my-drawer" aria-label="close sidebar" className="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>

            </label>
          </li>
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
          <li className="mt-4"><ToggleTheme /></li>
        </ul>
      </div>
    </div>

  )
}

export default Drawer