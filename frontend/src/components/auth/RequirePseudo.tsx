import { useUser } from '@/hooks/User';
import { Navigate, Outlet, useLocation } from 'react-router';

// Un joueur connecté sans pseudo (première connexion Google) le choisit avant toute autre page
export default function RequirePseudo() {
  const { needsPseudo } = useUser();
  const location = useLocation();

  if (needsPseudo) {
    return <Navigate to="/auth/pseudo" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
