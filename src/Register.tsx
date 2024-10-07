import { useState } from "react";

function Register() {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('firstname', firstname);
    console.log('lastname', lastname);
    console.log('pseudo', pseudo);
    console.log('email', email);
    console.log('password', password);
    console.log('passwordConfirm', passwordConfirm);
  }
  return (
    <form onSubmit={submitForm}>
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12">
        <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-xl">
          <h1 className="font-bold text-center text-2xl mb-5">S'inscrire au jeu</h1>
          <div className="bg-white shadow w-full rounded-lg divide-y divide-gray-200">
            <div className="px-5 py-7">
              <label htmlFor="firstname" className="font-semibold text-sm text-gray-600 pb-1 block">Prénom</label>
              <input
                name="firstname"
                type="text"
                onChange={(e) => setFirstname(e.target.value)}
                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
              <label htmlFor="lastname" className="font-semibold text-sm text-gray-600 pb-1 block">Nom</label>
              <input
                name="lastname"
                type="text"
                onChange={(e) => setLastname(e.target.value)}
                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
              <label htmlFor="pseudo" className="font-semibold text-sm text-gray-600 pb-1 block">Pseudo</label>
              <input
                name="pseudo"
                type="text"
                onChange={(e) => setPseudo(e.target.value)}
                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
              <label htmlFor="email" className="font-semibold text-sm text-gray-600 pb-1 block">E-mail</label>
              <input
                name="email"
                type="text"
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
              <label htmlFor="password" className="font-semibold text-sm text-gray-600 pb-1 block">Mot de passe</label>
              <input
                name="password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
              <label htmlFor="password-confirm" className="font-semibold text-sm text-gray-600 pb-1 block">Confirmer le mot de passe</label>
              <input
                name="password-confirm"
                type="password"
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
              <button onClick={submitForm} type="button" className="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block">
                <span className="inline-block mr-2">Créer mon compte</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
            <div className="py-5">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-center sm:text-left whitespace-nowrap">
                  <button className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block align-text-top">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span className="inline-block ml-1">Déjà un compte ? Me connecter</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
          <div className="py-5">
            <div className="grid grid-cols-2 gap-1">
              <div className="text-center sm:text-left whitespace-nowrap">
                <button className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block align-text-top">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="inline-block ml-1">Retour à l'accueil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default Register;