import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const ToggleMenu = () => {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onToggle={() => setOpen(!open)}>
      <summary>Mon compte</summary>
      <ul className="bg-base-100 rounded-t-none p-2">
        <li><NavLink to={'/auth/login'}>Connexion</NavLink></li>
        <li><NavLink to={'/auth/register'}>Créer un compte</NavLink></li>
      </ul>
    </details>
  )
}

const Header = () => {

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  console.log(open);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link to={"/"} className="btn btn-ghost text-xl">Skyjo d'Olivier</Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li><NavLink to={'/'}>Accueil</NavLink></li>
          <li>
            <ToggleMenu />
          </li>
        </ul>
        <button className="btn ml-4" onClick={toggleTheme}>
          {theme === 'light' ? '🌞' : '🌙'}
        </button>
      </div>
    </div>
  )
}

export default Header