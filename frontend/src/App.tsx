import { Link } from "react-router-dom";

function App() {

  return (
    <div className="flex flex-col justify-center w-full">
      <div className="hero bg-base-200 rounded-box lg:min-h-[50vh]">
        <div className="hero-content text-center">
          <div className="max-w-lg">
            <h1
              className="h-28 text-5xl font-bold bg-gradient-to-r from-yellow-300 to-red-500 bg-clip-text text-transparent font-courgette"
            >
              Bienvenue sur le Skyjo d'Olivier !
            </h1>
            <p className="py-6 text-xl">
              Jouez avec vos amis à SkyJo en ligne, gratuitement.<br />Des heures de fun en perspective !
            </p>
            <p className="flex flex-row justify-center space-x-4">
              <Link to={'/create'} className="btn btn-accent text-white">Créer une partie</Link>
              <Link to={'/public-rooms'} className="btn btn-primary text-white">Rejoindre une partie</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
