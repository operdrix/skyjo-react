import FormError from '@/components/auth/FormError';
import GoogleButton from '@/components/auth/GoogleButton';
import CustomField from '@/components/forms/CustomField';
import Modal, { MessageType } from '@/components/Modal';
import { useUser } from '@/hooks/User';
import { authClient } from '@/lib/authClient';
import { authErrorMessage } from '@/lib/authErrors';
import { Field, Form, Formik } from 'formik';
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import * as yup from 'yup';

const validationSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("L'email est requis"),
  password: yup.string().required("Le mot de passe est requis"),
});

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh } = useUser();
  const [message, setMessage] = useState<MessageType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [withEmail, setWithEmail] = useState<boolean>(false);
  const redirect: string = location.state?.from || '/';

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      const modal = document.getElementById('message_modal');
      (modal as HTMLDialogElement)?.showModal?.();
    }
  }, [location]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setErrorMessage('');
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }
    refresh();
    navigate(redirect);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <Modal id="message_modal" title={message?.title || "Succès"} message={message?.message || ''} type={message?.type || 'success'} />

      <div className="w-full max-w-sm">
        <h1 className="font-bold text-center text-2xl mb-5">Connexion au jeu</h1>

        <div className="bg-base-200 shadow-sm rounded-lg px-5 py-7 flex flex-col gap-4">
          <GoogleButton redirect={redirect} />

          {withEmail ? (
            <Formik initialValues={{ email: "", password: "" }} validationSchema={validationSchema} onSubmit={handleSubmit}>
              <Form>
                <div className="divider text-sm">ou</div>
                <FormError message={errorMessage} />
                <Field component={CustomField} id="email" name="email" label="E-mail" type="email" autoComplete="username" />
                <Field component={CustomField} id="password" name="password" label="Mot de passe" type="password" autoComplete="current-password" />
                <button type="submit" className="btn btn-primary w-full">Me connecter</button>
                <Link to="/auth/request-reset-password" className="link link-hover text-sm block text-center mt-4">
                  Mot de passe oublié ?
                </Link>
              </Form>
            </Formik>
          ) : (
            <button type="button" onClick={() => setWithEmail(true)} className="link link-hover text-sm text-center">
              Me connecter avec un email et un mot de passe
            </button>
          )}
        </div>

        <p className="text-sm text-center mt-5">
          Pas encore de compte ? <Link to="/auth/register" className="link">Créer un compte</Link>
        </p>
        <p className="text-sm text-center mt-2">
          <Link to="/" className="link link-hover">Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
