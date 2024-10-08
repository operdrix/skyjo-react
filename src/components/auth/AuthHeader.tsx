import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AuthHeader = () => {

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

        <button className="btn ml-4" onClick={toggleTheme}>
          {theme === 'light' ? '🌞' : '🌙'}
        </button>
      </div>
    </div>
  )
}

export default AuthHeader