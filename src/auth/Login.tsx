import { Field, Form, Formik } from 'formik';
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as yup from 'yup';
import CustomField from '../components/CustomField';

function Login() {

  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const navigate = useNavigate()

  useEffect(() => {
    if (error) {
      const modal = document.getElementById('error_modal');
      modal?.showModal();
    }
  }, [error]);

  useEffect(() => {
    if (location.state) {
      setSuccessMessage(location.state.message);
      const modal = document.getElementById('success_modal');
      modal?.showModal();
    }
  }, [location.state]);

  const [initialValues] = useState({
    email: "",
    password: "",
  });

  const validationSchema = yup.object().shape({
    email: yup.string().email().required("L'email est requis"),
    password: yup.string().required("Le mot de passe est requis"),
  });

  const handleSubmit = async (values: typeof initialValues) => {
    console.log("Form values", values);
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Success:', data);
        const token = data.token;
        localStorage.setItem('authToken', token);
        navigate('/', { state: { message: 'Vous êtes connecté' } });
      } else {
        console.error('Error bdd:', data);
        setError(true);
        setErrorMessage(data.error);
      }
    } catch (error) {
      console.error('Error serveur:', error);
      setError(true);
      setErrorMessage('Erreur serveur');
    }
  };

  return (
    <>
      <dialog id="success_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <div role="alert" className="alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Fermer</button>
            </form>
          </div>
        </div>
      </dialog>

      <dialog id="error_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <div role="alert" className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span>Oups ! Il semblerait qu'il y ait un problème</span>
          </div>
          <p className="py-4">{errorMessage}</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => setError(false)}>Fermer</button>
            </form>
          </div>
        </div>
      </dialog>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form>
          <h1 className="font-bold text-center text-2xl mb-5">Connexion au jeu</h1>
          <div className="bg-base-200 shadow w-full rounded-lg divide-y divide-base-100">
            <div className="px-5 py-7">
              <Field component={CustomField} name="email" label="E-mail" type='text' />
              <Field component={CustomField} name="password" label="Mot de passe" type='password' />
              <button
                type="submit"
                className="btn btn-primary w-full py-2.5 text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block"
              >
                <span className="inline-block mr-2">Me connecter</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
            <div className="py-5">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-center sm:text-left whitespace-nowrap">
                  <button className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-base-content hover:bg-base-100 ring-inset">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block align-text-top">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span className="inline-block ml-1">Mot de passe oublié ?</span>
                  </button>
                </div>
                <div className="text-center sm:text-right  whitespace-nowrap">
                  <button
                    className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-base-content hover:bg-base-100 ring-inset"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block align-text-bottom	">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="inline-block ml-1">Aide</span>
                  </button>
                </div>
                <div className="text-center sm:text-left whitespace-nowrap">
                  <Link
                    to={'/auth/register'}
                    className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-base-content hover:bg-base-100 ring-inset"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block align-text-bottom">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                    <span className="inline-block ml-1">Créer un compte</span>
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </Form>
      </Formik>
      <div className="py-5">
        <div className="grid grid-cols-2 gap-1">
          <div className="text-center sm:text-left whitespace-nowrap">
            <Link
              to={'/'}
              className="mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-base-content hover:bg-base-100 ring-inset">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block align-text-top">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="inline-block ml-1">Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;