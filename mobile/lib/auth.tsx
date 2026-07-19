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

// TEMPORAL: en true, la app no redirige a /login (para probar en Expo Go sin
// sesión). Las acciones que requieren usuario (publicar, grabar, calificar)
// quedan ocultas o inactivas. Regresar a false antes de generar un build real.
export const BYPASS_AUTH = true;

type AuthState = {
  session: Session | null;
  loading: boolean;
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
      value={{ session, loading, signInWithGoogle, signInWithApple, signOut }}
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
