import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

// Video de fondo (loop silencioso). Asset local optimizado.
const BG_VIDEO = require("../assets/login-bg.mp4");

// Páginas legales en la web. Placeholder: la web aún no tiene estas rutas;
// actualiza el dominio/ruta cuando existan.
const LEGAL = {
  terminos: "https://lineabrava.mx/terminos",
  privacidad: "https://lineabrava.mx/privacidad",
};

export default function Login() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState<null | "google" | "apple">(null);

  // Reproduce el video en bucle, en silencio y en automático.
  const player = useVideoPlayer(BG_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

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
      {/* Fondo: video off-road a pantalla completa */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      {/* Overlay oscuro parejo sobre todo el video, para legibilidad */}
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        {/* Logo discreto */}
        <View style={styles.logoRow}>
          <Image
            source={require("../assets/brand/logo.png")}
            style={{ width: 56, height: 17 }}
            resizeMode="contain"
          />
          <Text style={styles.wordmark}>LÍNEA BRAVA</Text>
        </View>

        {/* Contenido principal (centrado verticalmente) */}
        <View style={styles.center}>
          <Text style={styles.tagline}>
            La aventura <Text style={styles.taglineAccent}>off-road</Text> empieza
            aquí.
          </Text>

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
        </View>

        {/* Enlaces legales (abajo) */}
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink950 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  safe: { flex: 1, paddingHorizontal: 24, paddingVertical: 12 },

  // Logo
  logoRow: { alignItems: "center", marginTop: 24, gap: 6 },
  wordmark: {
    color: colors.trail500,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 18,
    letterSpacing: 3,
  },

  // Contenido centrado
  center: { flex: 1, justifyContent: "center", gap: 14 },
  tagline: {
    color: colors.bone,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 10,
    // Sombra sutil para reforzar la legibilidad sobre el video.
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  taglineAccent: { color: colors.trail500 },

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
    color: colors.bone,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  legalLink: { color: colors.trail400, textDecorationLine: "underline" },
});
