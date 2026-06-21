import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  session: Session | null;
  loading: boolean;
  // Login con correo + contraseña (sin deep links ni correos, ideal para Expo Go).
  // Si la cuenta no existe, la crea. Devuelve error o null.
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>; // devuelve error o null
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Entra con correo + contraseña. Si las credenciales no existen aún,
  // crea la cuenta automáticamente (requiere "Confirm email" apagado en Supabase).
  async function signInWithPassword(
    email: string,
    password: string
  ): Promise<string | null> {
    const e = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: e,
      password,
    });
    if (!error) return null; // onAuthStateChange recoge la sesión

    // Credenciales inválidas → puede ser cuenta nueva: intenta crearla.
    if (error.message.toLowerCase().includes("invalid")) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: e,
        password,
      });
      if (signUpError) return signUpError.message;
      if (!data.session) {
        return "Falta confirmar el correo. Apaga 'Confirm email' en Supabase (Authentication → Providers → Email) e intenta de nuevo.";
      }
      return null;
    }
    return error.message;
  }

  async function signInWithGoogle(): Promise<string | null> {
    const redirectTo = Linking.createURL("auth-callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return error.message;
    if (!data?.url) return "No se pudo iniciar sesión.";

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== "success") return null; // el usuario canceló

    const { queryParams } = Linking.parse(result.url);
    const code = queryParams?.code;
    if (!code) return "No se recibió el código de autenticación.";

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      String(code)
    );
    return exchangeError ? exchangeError.message : null;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, signInWithPassword, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
