import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as yup from 'yup';

function Register() {

  const [initialValues] = useState({
    firstname: "",
    lastname: "",
    pseudo: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const validationSchema = yup.object().shape({
    firstname: yup.string().required("Le prénom est requis"),
    lastname: yup.string().required("Le nom est requis"),
    pseudo: yup.string().required("Le pseudo est requis"),
    email: yup.string().email().required("L'email est requis"),
    password: yup.string().required("Le mot de passe est requis"),
    passwordConfirm: yup.string()
      .oneOf([yup.ref("password")], "Les mots de passe ne correspondent pas")
      .required("La confirmation du mot de passe est requise"),
  });

  const handleSubmit = (values: typeof initialValues) => {
    console.log("Form values", values);
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched }) => (
        <Form>
          <div className="min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12">
            <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-xl">
              <h1 className="font-bold text-center text-2xl mb-5">S'inscrire au jeu</h1>
              <div className="bg-white shadow w-full rounded-lg divide-y divide-gray-200">
                <div className="px-5 py-7">

                  <label htmlFor="firstname" className="font-semibold text-sm text-gray-600 pb-1 block">Prénom</label>
                  <Field
                    name="firstname"
                    type="text"
                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                  {errors.firstname && touched.firstname ? (
                    <div className="text-red-500 text-sm">{errors.firstname}</div>
                  ) : null}

                  <label htmlFor="lastname" className="font-semibold text-sm text-gray-600 pb-1 block">Nom</label>
                  <Field
                    name="lastname"
                    type="text"
                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                  {errors.lastname && touched.lastname ? (
                    <div className="text-red-500 text-sm">{errors.lastname}</div>
                  ) : null}

                  <label htmlFor="pseudo" className="font-semibold text-sm text-gray-600 pb-1 block">Pseudo</label>
                  <Field
                    name="pseudo"
                    type="text"
                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                  {errors.pseudo && touched.pseudo ? (
                    <div className="text-red-500 text-sm">{errors.pseudo}</div>
                  ) : null}

                  <label htmlFor="email" className="font-semibold text-sm text-gray-600 pb-1 block">E-mail</label>
                  <Field
                    name="email"
                    type="text"
                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                  {errors.email && touched.email ? (
                    <div className="text-red-500 text-sm">{errors.email}</div>
                  ) : null}

                  <label htmlFor="password" className="font-semibold text-sm text-gray-600 pb-1 block">Mot de passe</label>
                  <Field
                    name="password"
                    type="password"
                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                  {errors.password && touched.password ? (
                    <div className="text-red-500 text-sm">{errors.password}</div>
                  ) : null}

                  <label htmlFor="passwordConfirm" className="font-semibold text-sm text-gray-600 pb-1 block">Confirmer le mot de passe</label>
                  <Field
                    name="passwordConfirm"
                    type="password"
                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                  {errors.passwordConfirm && touched.passwordConfirm ? (
                    <div className="text-red-500 text-sm">{errors.passwordConfirm}</div>
                  ) : null}

                  <button type="submit" className="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block">
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
        </Form>
      )}
    </Formik>
  );
}

export default Register;