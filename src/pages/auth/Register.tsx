import { Field, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import CustomField from '../../components/forms/CustomField';
import Modal from '../../components/Modal';

function Register() {

  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate()

  useEffect(() => {
    if (error) {
      const modal = document.getElementById('error_modal');
      (modal as HTMLDialogElement)?.showModal();
    }
  }, [error]);

  const [initialValues] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const validationSchema = yup.object().shape({
    firstname: yup.string().required("Le prénom est requis"),
    lastname: yup.string().required("Le nom est requis"),
    username: yup.string().required("Le nom d'utilisateur est requis"),
    email: yup.string().email().required("L'email est requis"),
    password: yup.string().required("Le mot de passe est requis"),
    passwordConfirm: yup.string()
      .oneOf([yup.ref("password")], "Les mots de passe ne correspondent pas")
      .required("La confirmation du mot de passe est requise"),
  });

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      console.log("Form values", values);
      const response = await fetch(`${process.env.BACKEND_HOST}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Success:', data);
        navigate('/auth/login', {
          state: {
            message: {
              title: 'Compte créé',
              message: 'Votre compte a bien été créé.<br><br>Veuillez consulter vos mails pour confirmer votre adresse email.<br><br>Une fois votre adresse email confirmée, vous pourrez vous connecter avec vos identifiants.',
              type: 'success'
            }
          }
        });
      } else {
        console.error('Error bdd:', data);
        setError(true);
        setErrorMessage(data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error serveur:', error);
      setError(true);
      setErrorMessage('Une erreur est survenue');
      setLoading(false);
    }
  };
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center">
        <Modal id="error_modal" title="Oups ! Il semblerait qu'il y ait un problème" message={errorMessage} type="error" />

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          <Form>
            <h1 className="font-bold text-center text-2xl mb-5">S'inscrire au jeu</h1>
            <div className="bg-base-200 shadow w-full rounded-lg divide-y divide-base-100">
              <div className="px-5 py-7">
                <Field component={CustomField} name="firstname" label="Prénom" type='text' />
                <Field component={CustomField} name="lastname" label="Nom" type='text' />
                <Field component={CustomField} name="username" label="Nom d'utilisateur" type='text' />
                <Field component={CustomField} name="email" label="E-mail" type='text' />
                <Field component={CustomField} name="password" label="Mot de passe" type='password' />
                <Field component={CustomField} name="passwordConfirm" label="Confirmer le mot de passe" type='password' />

                <button
                  type="submit"
                  className="btn btn-primary w-full py-2.5 text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block"
                  disabled={loading}
                >
                  <span className="inline-block mr-2">Créer mon compte</span>
                  {loading ?
                    <span className="loading loading-ring loading-sm align-middle"></span>
                    :
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  }
                </button>

              </div>
              <div className="py-5">
                <div className="grid grid-cols-2 gap-1">
                  <div className="text-center sm:text-left whitespace-nowrap">
                    <Link
                      to={'/auth/login'}
                      className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block align-text-top">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                      </svg>
                      <span className="inline-block ml-1">Déjà un compte ? Me connecter</span>
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
                className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset">
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

export default Register;