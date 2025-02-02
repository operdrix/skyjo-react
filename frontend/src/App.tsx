import { Link } from "react-router-dom";

function App() {

  return (
    <div className="flex-1 container mx-auto flex items-center">
      <div className="flex flex-col justify-center w-full">
        <div className="hero bg-base-200 sm:rounded-box min-h-[50vh]">
          <div className="hero-content text-center">
            <div className="max-w-lg">
              {/* <img
                src="/images/logo.svg"
                alt="SkyJo"
                className="mx-auto"
              /> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlSpace="prserve"
                className="mx-auto w-full text-logo-text"
                viewBox="0 0 1500 229"
              >
                <path className="fill-current" d="M519.817 204.398q-7.17 0-13.29-2.39-6.12-2.4-10.03-7.46t-4.74-12.88h16.75q.64 2.58 2.39 4.19t4.37 2.35q2.62.73 5.66.73 1.84 0 3.77-.37 1.93-.36 3.26-1.38 1.34-1.01 1.34-2.94 0-1.38-.78-2.25-.79-.88-2.21-1.48-1.43-.59-3.54-1.05-.83-.19-1.71-.37l-1.7-.37q-.83-.18-1.75-.37-4.69-1.01-9.01-2.34-4.33-1.34-7.64-3.55-3.31-2.2-5.24-5.88t-1.93-9.3q0-5.15 1.84-8.69t4.87-5.7q3.04-2.17 6.63-3.27 3.58-1.1 7.08-1.52 3.5-.41 6.26-.41 6.8 0 11.96 2.53 5.15 2.53 8.32 7.4 3.18 4.88 3.82 11.78h-16.1q-.28-2.02-1.66-3.45t-3.54-2.21-5.01-.78q-1.66 0-3.13.28-1.47.27-2.53.82-1.06.56-1.7 1.38-.65.83-.65 1.94 0 1.47 1.15 2.48t3.41 1.75q2.25.73 5.56 1.56 1.57.37 3.04.69t2.94.69q4.05.92 7.59 2.12 3.55 1.19 6.26 3.13 2.71 1.93 4.28 5.19 1.56 3.27 1.56 8.33 0 5.8-2.21 9.8-2.2 4-5.98 6.48-3.77 2.49-8.46 3.64t-9.57 1.15m52.81-.74h-16.28v-65.13h16.28v33.76h4.88l10.12-17.11h18.21l-14.99 23.09 16.19 25.39h-18.77l-10.49-16.83h-5.15Zm61.55 22.82q-5.61 0-11.04-1.43-5.43-1.42-10.49-4.64l4.97-13.16q2.48 1.84 6.02 2.94 3.55 1.11 8.24 1.11 6.81 0 10.35-2.62 3.54-2.63 3.54-8.51v-.37q-1.56 1.75-3.77 2.76t-4.6 1.42q-2.39.42-4.69.42-6.9 0-11.18-2.99t-6.26-8.14q-1.98-5.16-1.98-11.6v-26.49h16.2v23.55q0 1.66.23 3.54.23 1.89 1.05 3.59.83 1.7 2.53 2.76 1.71 1.06 4.56 1.06 3.86 0 5.47-1.89 1.61-1.88 1.93-4.55.33-2.67.33-5.15v-22.91h16.28v36.89q0 7.54-1.15 13.85-1.15 6.3-4.14 10.9t-8.42 7.13-13.98 2.53m38.18-2.58h-8.47v-14.63h3.78q2.48 0 3.49-.92t1.15-2.11q.14-1.2.14-1.93v-49.13h16.28v51.7q0 5.71-1.56 9.48t-5.15 5.66q-3.59 1.88-9.66 1.88m8.19-72.03q-4.42 0-7.13-2.63-2.72-2.62-2.72-6.85 0-4.32 2.85-7.08 2.86-2.76 7.09-2.76 4.05 0 6.9 2.62t2.85 7.13q0 4.32-2.71 6.94-2.72 2.63-7.13 2.63m44.06 52.53q-7.17 0-12.92-2.85-5.75-2.86-9.16-8.42-3.4-5.57-3.4-13.57 0-8.19 3.45-13.85t9.15-8.6q5.71-2.94 12.61-2.94 7.08 0 12.74 3.03 5.66 3.04 9.02 8.74 3.35 5.71 3.35 13.89 0 7.92-3.22 13.44t-8.83 8.32q-5.61 2.81-12.79 2.81m-.27-15.09q3.49 0 5.52-1.47 2.02-1.47 2.85-3.73.83-2.25.83-4.46t-.83-4.6-2.81-4.05q-1.98-1.65-5.56-1.65-3.5 0-5.57 1.65-2.07 1.66-2.9 4-.83 2.35-.83 4.65t.88 4.55q.87 2.26 2.9 3.68 2.02 1.43 5.52 1.43m93.93 15.09q-9.75 0-16.98-4.1-7.22-4.09-11.17-11.63-3.96-7.55-3.96-17.85 0-7.73 2.25-13.85 2.26-6.12 6.49-10.44t10.17-6.58q5.93-2.25 13.2-2.25 7.54 0 13.85 2.53 6.3 2.53 10.48 7.82 4.19 5.29 5.29 13.48h-16.47q-.55-2.95-2.16-4.7-1.61-1.74-4.04-2.57-2.44-.83-5.57-.83-4.6 0-7.73 1.56-3.13 1.57-5.01 4.19-1.89 2.62-2.72 5.8-.82 3.17-.82 6.39 0 4.32 1.51 8.33 1.52 4 4.97 6.48 3.45 2.49 9.34 2.49 2.94 0 5.61-.74t4.51-2.35 2.3-4.18h-15.36v-13.99h32.84v2.4q0 10.94-3.31 18.67t-10.12 11.82q-6.81 4.1-17.39 4.1m55.47 0q-3.4 0-6.44-.92-3.03-.92-5.38-2.76-2.34-1.84-3.72-4.6t-1.38-6.53q0-5.52 2.34-8.65 2.35-3.13 6.35-4.6t9.11-1.89q5.1-.41 10.62-.41h2.21q0-1.75-.83-3.13-.82-1.38-2.34-2.21t-3.73-.83q-1.56 0-3.03.46-1.48.46-2.44 1.25-.97.78-1.15 1.88h-16.19q.55-4.51 2.67-7.77 2.11-3.27 5.33-5.34t7.22-3.08 8.33-1.01q10.67 0 16.14 5.93 5.48 5.94 5.48 17.44v26.03h-15v-6.35q-2.39 3.59-5.38 5.06-2.99 1.48-5.43 1.75-2.44.28-3.36.28m4.42-12.42q2.3 0 4.46-1.15 2.17-1.15 3.59-2.9 1.43-1.75 1.43-3.5v-.36h-9.11q-1.11 0-2.12.23t-1.79.69-1.24 1.19q-.46.74-.46 1.84 0 1.29.69 2.16.69.88 1.88 1.34 1.2.46 2.67.46m52.06 11.68h-16.28v-48.48h14.35l1.47 5.15q2.12-2.85 4.56-4.14t4.64-1.61q2.21-.32 3.5-.32 3.86 0 7.31 1.33 3.45 1.34 5.75 5.2 2.12-2.76 4.56-4.14t4.87-1.89q2.44-.5 4.65-.5 5.89 0 9.48 2.39 3.58 2.39 5.29 6.72 1.7 4.32 1.7 10.21v30.08h-16.29v-27.05q0-1.1-.13-2.39-.14-1.29-.69-2.44-.56-1.15-1.57-1.93t-2.85-.78q-1.93 0-3.13.74-1.19.73-1.88 1.93-.69 1.19-.97 2.71t-.28 3.08v26.13h-16.28v-27.14q0-1.01-.18-2.25-.19-1.24-.74-2.44t-1.7-1.98-3.18-.78q-2.85 0-4.14 1.56-1.28 1.57-1.56 3.68-.28 2.12-.28 3.68Zm89.53.74q-7.45 0-13.02-2.99-5.56-2.99-8.65-8.51-3.08-5.52-3.08-13.16 0-7.63 3.13-13.38t8.74-8.97 13.06-3.22q5.34 0 9.57 1.65 4.23 1.66 7.27 4.79 3.04 3.12 4.65 7.54t1.61 9.94q0 1.56-.14 2.99-.14 1.42-.51 2.99h-31.28q.19 1.74 1.15 3.31.97 1.56 2.72 2.48 1.74.92 4.41.92 2.21 0 3.82-.5 1.61-.51 2.62-1.34t1.29-1.65h15.92q-1.29 5.98-4.74 9.79-3.45 3.82-8.28 5.57t-10.26 1.75m-8.37-30.91h16.37q0-1.38-.78-2.9t-2.57-2.53q-1.8-1.01-4.74-1.01-2.85 0-4.69 1.01t-2.72 2.53q-.87 1.52-.87 2.9" />
                <g fill="#ff5630">
                  <path d="M723.285 80.718a4.2 4.2 0 0 1-1.232-8.218c18.76-5.74 37.772-7.504 57.89-5.32l-16.968-43.344c-4.144-10.584-37.548-4.788-48.524-2.884l-2.632.448a4.203 4.203 0 1 1-1.4-8.288l2.604-.434c16.59-2.884 51.128-8.862 57.764 8.092l19.558 49.938a4.2 4.2 0 0 1-4.536 5.684c-21.504-3.248-41.552-1.904-61.292 4.144q-.63.168-1.232.182" />
                  <path d="M764.851 95.768a4.2 4.2 0 0 1-2.8-7.336l21.56-19.32a4.2 4.2 0 0 1 5.614 6.244l-10.192 9.142q10.696-1.512 21.448-1.372 10.486.14 21.406 1.82L807.02 40.888c-1.204-3.57-7.574-9.142-36.68-6.51a4.203 4.203 0 0 1-.756-8.372c17.192-1.54 40.6-1.974 45.388 12.18l17.136 50.82a4.2 4.2 0 0 1-4.816 5.46 147 147 0 0 0-26.922-2.94 131.6 131.6 0 0 0-34.496 4.116q-.518.14-1.022.14" />
                  <path d="M764.865 95.796a4.2 4.2 0 0 1-3.878-2.562l-8.848-20.902a4.203 4.203 0 1 1 7.742-3.276l8.848 20.902a4.2 4.2 0 0 1-3.864 5.838m-33.572 18.158a4.2 4.2 0 0 1-4.088-3.178l-26.6-105.588a4.2 4.2 0 1 1 8.134-2.044l26.628 105.588a4.2 4.2 0 0 1-4.074 5.222" />
                </g>
              </svg>

              <h1
                className="text-5xl font-bold text-title font-courgette py-4"
              >
                Bienvenue sur le Skyjo d'Olivier !
              </h1>
              <p className="py-6 text-xl">
                Jouez avec vos amis à SkyJo en ligne, gratuitement.<br />Des heures de fun en perspective !
              </p>
              <p className="flex flex-wrap justify-center gap-4">
                <Link
                  to={'/create'}
                  className="btn btn-neutral w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>

                  Créer une partie
                </Link>
                <Link
                  to={'/public-rooms'}
                  className="btn btn-neutral w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                  Rejoindre une partie
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
