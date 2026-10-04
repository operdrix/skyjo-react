import FormError from "@/components/auth/FormError";
import GoogleButton from "@/components/auth/GoogleButton";
import CustomField from "@/components/forms/CustomField";
import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { authErrorMessage } from "@/lib/authErrors";
import { safeRedirect, withRedirect } from "@/lib/redirect";
import { PSEUDO_MAX, PSEUDO_MIN, PSEUDO_PATTERN } from "@/lib/pseudo";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("L'email est requis"),
  username: yup
    .string()
    .trim()
    .min(PSEUDO_MIN, `${PSEUDO_MIN} caractères minimum`)
    .max(PSEUDO_MAX, `${PSEUDO_MAX} caractères maximum`)
    .matches(PSEUDO_PATTERN, "Lettres, chiffres, espace, point ou tiret uniquement")
    .required("Le pseudo est requis"),
  password: yup.string().min(8, "8 caractères minimum").required("Le mot de passe est requis"),
});

function Register() {
  const [searchParams] = useSearchParams();
  const { refresh, isAuthentified } = useUser();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [withEmail, setWithEmail] = useState<boolean>(false);

  const handleSubmit = async ({ email, username, password }: { email: string; username: string; password: string }) => {
    setErrorMessage("");
    const pseudo = username.trim();
    const { error } = await authClient.signUp.email({ email, password, name: pseudo, username: pseudo });
    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }
    // La redirection se fait une fois la session rechargée
    refresh();
  };

  if (isAuthentified) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-bold text-center text-2xl mb-2">Créer un compte</h1>
        <p className="text-center mb-5">Un clic et c'est parti !</p>

        <div className="bg-base-200 shadow-sm rounded-lg px-5 py-7 flex flex-col gap-4">
          <GoogleButton redirect={redirect} />

          {withEmail ? (
            <Formik
              initialValues={{ email: "", username: "", password: "" }}
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
                  autoComplete="email"
                />
                <Field component={CustomField} id="username" name="username" label="Pseudo" autoComplete="nickname" />
                <Field
                  component={CustomField}
                  id="password"
                  name="password"
                  label="Mot de passe"
                  type="password"
                  autoComplete="new-password"
                />
                <button type="submit" className="btn btn-primary w-full">
                  Créer mon compte et jouer
                </button>
              </Form>
            </Formik>
          ) : (
            <button type="button" onClick={() => setWithEmail(true)} className="link link-hover text-sm text-center">
              M'inscrire avec un email et un mot de passe
            </button>
          )}

          <p className="text-xs text-center opacity-70">
            En continuant, vous acceptez les{" "}
            <Link to="/cgu" className="link">
              conditions d'utilisation
            </Link>
            . Seuls votre pseudo et votre email sont demandés : voir la{" "}
            <Link to="/privacy" className="link">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>

        <p className="text-sm text-center mt-5">
          Déjà un compte ?{" "}
          <Link to={withRedirect("/auth/login", redirect)} className="link">
            Me connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
