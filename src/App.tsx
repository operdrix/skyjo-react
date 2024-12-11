import { Link } from "react-router-dom";

function App() {

  return (
    <div className="flex flex-col justify-center w-full font-courgette">
      <div className="hero bg-base-200 rounded-box mt-5 min-h-[50vh]">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1
              className="text-5xl font-bold bg-gradient-to-r from-blue-700 via-yellow-300 to-red-500 bg-clip-text text-transparent"
            >Bienvenue sur SkyJo online !</h1>
            <p className="py-6 text-xl">
              Jouez avec vos amis à SkyJo en ligne, gratuitement. Des heures de fun en perspective !
            </p>
            <p className="flex flex-row justify-center space-x-4">
              <Link to={'/game/create'} className="btn btn-accent text-white">Créer une partie</Link>
              <Link to={'/game/public'} className="btn btn-primary text-white">Rejoindre une partie</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
