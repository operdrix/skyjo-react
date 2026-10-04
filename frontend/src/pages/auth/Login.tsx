import FormError from "@/components/auth/FormError";
import GoogleButton from "@/components/auth/GoogleButton";
import CustomField from "@/components/forms/CustomField";
import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { authErrorMessage } from "@/lib/authErrors";
import { safeRedirect, withRedirect } from "@/lib/redirect";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("L'email est requis"),
  password: yup.string().required("Le mot de passe est requis"),
});

function Login() {
  const [searchParams] = useSearchParams();
  const { refresh, isAuthentified } = useUser();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [withEmail, setWithEmail] = useState<boolean>(false);
  const redirect = safeRedirect(searchParams.get("redirect"));

  const handleSubmit = async (values: { email: string; password: string }) => {
    setErrorMessage("");
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }
    // La redirection se fait une fois la session rechargée (sinon la page de jeu renverrait ici)
    refresh();
  };

  if (isAuthentified) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="font-bold text-3xl mb-2">Content de te revoir !</h1>
        <p className="text-muted mb-5">Connecte-toi pour retrouver tes parties.</p>

        <div className="panel px-5 py-7 sm:px-7 flex flex-col gap-4">
          <GoogleButton redirect={redirect} />

          {withEmail ? (
            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              <Form>
                <div className="divider text-sm">ou</div>
                <FormError message={errorMessage} />
                <Field
                  component={CustomField}
                  id="email"
                  name="email"
                  label="E-mail"
                  type="email"
                  autoComplete="username"
                />
                <Field
                  component={CustomField}
                  id="password"
                  name="password"
                  label="Mot de passe"
                  type="password"
                  autoComplete="current-password"
                />
                <button type="submit" className="btn btn-primary w-full">
                  Me connecter
                </button>
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
          Pas encore de compte ?{" "}
          <Link to={withRedirect("/auth/register", redirect)} className="link">
            Créer un compte
          </Link>
        </p>
        <p className="text-sm text-center mt-2">
          <Link to="/" className="link link-hover">
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
