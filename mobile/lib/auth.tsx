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

// Interruptor de emergencia: en true, la app no redirige a /login (útil para
// probar en Expo Go sin sesión). Con el login activo debe quedarse en false.
export const BYPASS_AUTH = false;

type AuthState = {
  session: Session | null;
  loading: boolean;
  // Login con correo + contraseña (sin deep links ni correos, ideal para Expo Go).
  // Si la cuenta no existe, la crea. Devuelve error o null.
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  // Crea o cambia la contraseña del usuario con sesión activa. Sirve para que
  // quien entró con Google pueda luego entrar con correo + contraseña.
  setPassword: (password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>; // devuelve error o null
  signInWithApple: () => Promise<string | null>; // devuelve error o null
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
      if (data.session) return null; // cuenta nueva, ya con sesión

      // Supabase oculta que el correo ya existe devolviendo un usuario sin
      // identidades. Si es el caso, la cuenta es de Google (o tiene otra
      // contraseña), no un correo por confirmar.
      if (data.user && data.user.identities?.length === 0) {
        return "Ese correo ya tiene cuenta. Si entraste con Google, entra con Google y crea tu contraseña desde Perfil.";
      }
      return "Falta confirmar el correo. Apaga 'Confirm email' en Supabase (Authentication → Providers → Email) e intenta de nuevo.";
    }
    return error.message;
  }

  // Crea o cambia la contraseña de la sesión activa. Tras esto, la cuenta
  // también puede entrar con correo + contraseña.
  async function setPassword(password: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? error.message : null;
  }

  // Flujo OAuth genérico (Google / Apple): abre el navegador, recoge el código
  // del deep link y lo canjea por una sesión. Devuelve error o null.
  async function signInWithProvider(
    provider: "google" | "apple"
  ): Promise<string | null> {
    const redirectTo = Linking.createURL("auth-callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
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

  const signInWithGoogle = () => signInWithProvider("google");
  // Requiere configurar Apple como proveedor OAuth en Supabase
  // (Authentication → Providers → Apple) para que autentique de verdad.
  const signInWithApple = () => signInWithProvider("apple");

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signInWithPassword,
        setPassword,
        signInWithGoogle,
        signInWithApple,
        signOut,
      }}
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
