import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

// Páginas legales en la web. Placeholder: la web aún no tiene estas rutas;
// actualiza el dominio/ruta cuando existan.
const LEGAL = {
  terminos: "https://lineabrava.mx/terminos",
  privacidad: "https://lineabrava.mx/privacidad",
};

export default function Login() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState<null | "google" | "apple">(null);

  async function handleGoogle() {
    setBusy("google");
    const error = await signInWithGoogle();
    setBusy(null);
    // Si todo sale bien, el guard de sesión navega solo a las pestañas.
    if (error) Alert.alert("No se pudo entrar con Google", error);
  }

  async function handleApple() {
    setBusy("apple");
    const error = await signInWithApple();
    setBusy(null);
    if (error) Alert.alert("No se pudo entrar con Apple", error);
  }

  return (
    <View style={styles.root}>
      {/* Fondo premium estático. TODO: aquí va <VideoView> cuando se agregue el
          video de fondo off-road; las capas de abajo sirven de overlay/fallback. */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.bgBase} />
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <View style={styles.overlay} />
      </View>

      <SafeAreaView style={styles.safe}>
        {/* Logo discreto */}
        <View style={styles.logoRow}>
          <MaterialCommunityIcons
            name="image-filter-hdr"
            size={32}
            color={colors.trail500}
          />
          <Text style={styles.wordmark}>LÍNEA BRAVA</Text>
        </View>

        <View style={styles.spacer} />

        {/* Contenido principal */}
        <View style={styles.content}>
          <Text style={styles.tagline}>La aventura off-road empieza aquí.</Text>

          <Pressable
            style={[styles.btnSocial, busy === "google" && styles.btnDisabled]}
            onPress={handleGoogle}
            disabled={busy !== null}
          >
            <Ionicons name="logo-google" size={20} color={colors.ink950} />
            <Text style={styles.btnSocialText}>
              {busy === "google" ? "Abriendo…" : "Continuar con Google"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.btnSocial, busy === "apple" && styles.btnDisabled]}
            onPress={handleApple}
            disabled={busy !== null}
          >
            <Ionicons name="logo-apple" size={20} color={colors.ink950} />
            <Text style={styles.btnSocialText}>
              {busy === "apple" ? "Abriendo…" : "Continuar con Apple"}
            </Text>
          </Pressable>

          <Text style={styles.legal}>
            Al continuar aceptas los{" "}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL(LEGAL.terminos)}
            >
              Términos
            </Text>{" "}
            y la{" "}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL(LEGAL.privacidad)}
            >
              Privacidad
            </Text>
            .
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink950 },
  safe: { flex: 1, paddingHorizontal: 24, paddingVertical: 12 },

  // Fondo
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.ink950 },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: colors.trail500,
    opacity: 0.1,
  },
  glowBottom: {
    position: "absolute",
    bottom: -140,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 360,
    backgroundColor: colors.trail500,
    opacity: 0.07,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },

  // Logo
  logoRow: { alignItems: "center", marginTop: 24, gap: 6 },
  wordmark: {
    color: colors.trail500,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
  },

  spacer: { flex: 1 },

  // Contenido
  content: { gap: 14 },
  tagline: {
    color: colors.bone,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 10,
  },

  btnSocial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.bone,
    paddingVertical: 16,
    borderRadius: 999,
  },
  btnSocialText: { color: colors.ink950, fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },

  legal: {
    color: colors.mute,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  legalLink: { color: colors.trail400, textDecorationLine: "underline" },
});
