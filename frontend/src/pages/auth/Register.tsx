import FormError from "@/components/auth/FormError";
import GoogleButton from "@/components/auth/GoogleButton";
import CustomField from "@/components/forms/CustomField";
import ThemeField from "@/components/forms/ThemeField";
import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { authErrorMessage } from "@/lib/authErrors";
import { safeRedirect, withRedirect } from "@/lib/redirect";
import { pseudoSchema } from "@/lib/pseudo";
import { readThemePrefs, type ThemeStyle } from "@/lib/theme";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("L'email est requis"),
  username: pseudoSchema,
  password: yup.string().min(8, "8 caractères minimum").required("Le mot de passe est requis"),
});

function Register() {
  const [searchParams] = useSearchParams();
  const { refresh, isAuthentified, isGuest, userName } = useUser();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [withEmail, setWithEmail] = useState<boolean>(false);

  const handleSubmit = async ({
    email,
    username,
    password,
    theme,
  }: {
    email: string;
    username: string;
    password: string;
    theme: ThemeStyle;
  }) => {
    setErrorMessage("");
    const pseudo = username.trim();
    const { error } = await authClient.signUp.email({ email, password, name: pseudo, username: pseudo, theme });
    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }
    // La redirection se fait une fois la session rechargée
    refresh();
  };

  // Un invité peut créer son compte depuis sa session invité
  if (isAuthentified && !isGuest) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="font-bold text-3xl mb-2">Créer un compte</h1>
        <p className="text-muted mb-5">Un clic et c'est parti !</p>

        <div className="panel px-5 py-7 sm:px-7 flex flex-col gap-4">
          <GoogleButton redirect={redirect} />

          {withEmail ? (
            <Formik
              // Un invité garde son pseudo par défaut
              initialValues={{
                email: "",
                username: isGuest ? (userName ?? "") : "",
                password: "",
                theme: readThemePrefs(localStorage).style,
              }}
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
                <ThemeField />
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

        {/* Un invité ne se connecte pas à un compte existant (pas de fusion des parties) */}
        {!isGuest && (
          <p className="text-sm text-center mt-5">
            Déjà un compte ?{" "}
            <Link to={withRedirect("/auth/login", redirect)} className="link">
              Me connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Register;
