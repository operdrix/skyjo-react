import Logo from "@/components/brand/Logo";
import ToggleTheme from "@/components/nav/ToggleTheme";
import { Link } from "react-router";

const AuthHeader = () => {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
      <Logo />
      <div className="flex items-center gap-2">
        <Link to="/" className="btn btn-ghost btn-sm">
          Accueil
        </Link>
        <ToggleTheme />
      </div>
    </header>
  );
};

export default AuthHeader;
