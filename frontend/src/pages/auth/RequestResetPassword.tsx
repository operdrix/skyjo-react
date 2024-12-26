import CustomField from '@/components/forms/CustomField';
import { MessageType } from '@/components/Modal';
import { Field, Form, Formik } from 'formik';
import { useState } from "react";
import { Link } from "react-router-dom";
import * as yup from 'yup';


function RequestResetPassword() {

  const [message, setMessage] = useState<MessageType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialValues] = useState({ email: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const validationSchema = yup.object().shape({
    email: yup.string().email().required("L'email est requis"),
  });

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.VITE_BACKEND_HOST}/password-reset-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      await response.json();

      setMessage({ title: 'Mail envoyé', message: 'Un mail de réinitialisation de mot de passe vous a été envoyé', type: 'success' });

    } catch (error) {
      console.error('Error serveur:', error);
      setErrorMessage('Erreur serveur, veuillez réessayer plus tard');
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div className="flex-1 container mx-auto flex items-center">
        <div className="hero bg-base-200 min-h-[50vh] p-20">
          <div className="hero-content flex-col lg:flex-row text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="md:size-96 max-w-sm text-card-green">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>

            <div>
              <h1 className="text-5xl font-bold">
                {message.title}
              </h1>
              <p className="py-6 text-xl">
                {message.message}
              </p>
              <Link to={'/'} className="btn bg-card-green border-card-green text-base-100">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex-1 container mx-auto flex items-center">
        <div className="hero bg-base-200 min-h-[50vh] p-20">
          <div className="hero-content flex-col lg:flex-row text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="md:size-96 max-w-sm text-warning">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div>
              <h1 className="text-5xl font-bold">
                Une erreur est survenue 😕
              </h1>
              <p className="py-6 text-xl">
                {errorMessage}
              </p>
              <Link to={'/auth/login'} className="btn bg-card-red border-card-red text-base-100">
                Retour à la page de login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container flex-1 flex flex-col items-center justify-center mx-auto">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          <Form className='w-full max-w-lg'>
            <h1 className="font-bold text-center text-2xl mb-5">Mot de passe perdu ! 🤷‍♂️</h1>
            <div className="bg-base-200 shadow w-full md:rounded-lg divide-y divide-base-100">
              <div className="px-5 py-7">
                <Field component={CustomField} name="email" label="E-mail" type='email' autoComplete="username" />
                <button
                  type="submit"
                  className="btn btn-primary w-full py-2.5 text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block space-x-4"
                  disabled={loading}
                >
                  <span>Envoyer de mail de réinitialisation</span>
                  {!loading && <span className="loading loading-spinner loading-sm"></span>}
                </button>
              </div>
              <div className="py-5">
                <div className="grid grid-cols-2 gap-1">
                  <div className="text-center sm:text-left whitespace-nowrap">
                    <Link
                      to={'/auth/login'}
                      className="flex items-center transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-base-content hover:bg-base-100 ring-inset">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block align-text-top">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                      </svg>
                      <span className="inline-block ml-1">Connexion</span>
                    </Link>
                  </div>
                  <div className="text-center sm:text-left whitespace-nowrap">
                    <Link
                      to={'/auth/register'}
                      className="flex items-center transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-base-content hover:bg-base-100 ring-inset"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block align-text-bottom">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                      </svg>
                      <span className="inline-block ml-1">Enregistrement</span>
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
      </div>
    </>
  );
}

export default RequestResetPassword;