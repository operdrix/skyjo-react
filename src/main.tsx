import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import AppLayout from './AppLayout.tsx'
import AuthLayout from './auth/AuthLayout.tsx'
import Login from './auth/Login.tsx'
import Register from './auth/Register.tsx'
import VerifyEmail from './auth/VerifyEmail.tsx'
import { UserProvider } from './context/UserContext.tsx'
import Create from './game/Create.tsx'
import Game from './game/Game.tsx'
import JoinPublic from './game/JoinPublic.tsx'
import Waiting from './game/Waiting.tsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <App />
      },
      {
        // Lien pour créer une partie
        path: '/game/create',
        element: <Create />
      },
      {
        // Lien pour consulter les parties publiques
        path: '/game/public',
        element: <JoinPublic />
      },
      {
        // Salle de jeu
        path: '/game/:gameId',
        element: <Game />
      },
      {
        // Lien de la salle d'attente
        path: '/game/:gameId/waiting',
        element: <Waiting />
      },


    ]
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: '/auth/login',
        element: <Login />
      },
      {
        path: '/auth/register',
        element: <Register />
      },
      {
        path: '/auth/verify/:token',
        element: <VerifyEmail />
      }
    ]
  }

])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </StrictMode>,
)
