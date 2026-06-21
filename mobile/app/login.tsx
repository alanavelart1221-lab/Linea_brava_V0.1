import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function Login() {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    const e = email.trim();
    if (!e.includes("@") || !e.includes(".")) {
      Alert.alert("Correo inválido", "Escribe un correo válido.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña muy corta", "Usa al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    const error = await signInWithPassword(e, password);
    setBusy(false);
    // Si todo sale bien, el guard de sesión navega solo a las pestañas.
    if (error) Alert.alert("No se pudo entrar", error);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>LÍNEA BRAVA</Text>
        <Text style={styles.tagline}>
          Graba tus rutas off-road, marca waypoints y compártelas con la comunidad.
        </Text>
      </View>

      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="tucorreo@ejemplo.com"
        placeholderTextColor={colors.mute}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!busy}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={colors.mute}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />

      <Pressable
        style={[styles.btnPrimary, busy && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={busy}
      >
        <Text style={styles.btnPrimaryText}>{busy ? "Entrando…" : "Entrar"}</Text>
      </Pressable>

      <Text style={styles.hint}>
        Si es tu primera vez, se crea tu cuenta automáticamente con este correo y contraseña.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950, padding: 24, justifyContent: "center" },
  hero: { marginBottom: 40 },
  brand: { color: colors.bone, fontSize: 44, fontWeight: "900", letterSpacing: 1 },
  tagline: { color: colors.mute, fontSize: 16, marginTop: 12, lineHeight: 22 },
  label: { color: colors.bone, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: {
    backgroundColor: colors.ink800,
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.bone,
    fontSize: 16,
    marginBottom: 16,
  },
  btnPrimary: { backgroundColor: colors.trail500, paddingVertical: 16, borderRadius: 999, alignItems: "center", marginTop: 4 },
  btnPrimaryText: { color: colors.ink950, fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  hint: { color: colors.mute, fontSize: 13, marginTop: 16, lineHeight: 19, textAlign: "center" },
});
