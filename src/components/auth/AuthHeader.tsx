import { Link, NavLink } from "react-router-dom";
import ToggleTheme from "../ToggleTheme";

const AuthHeader = () => {
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link to={"/"} className="btn btn-ghost text-xl">Skyjo d'Olivier</Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li><NavLink to={'/'}>Accueil</NavLink></li>
        </ul>
        <ToggleTheme />
      </div>
    </div>
  )
}

export default AuthHeader