import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function CrearContrasena() {
  const router = useRouter();
  const { session, setPassword } = useAuth();
  const [password, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function guardar() {
    if (password.length < 6) {
      Alert.alert("Contraseña muy corta", "Usa al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("No coinciden", "Las dos contraseñas deben ser iguales.");
      return;
    }
    setBusy(true);
    const error = await setPassword(password);
    setBusy(false);
    if (error) {
      Alert.alert("No se pudo guardar", error);
      return;
    }
    Alert.alert(
      "Contraseña lista",
      "Ya puedes entrar con tu correo y esta contraseña.",
      [{ text: "Listo", onPress: () => router.back() }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.intro}>
        Si entraste con Google, tu cuenta no tiene contraseña. Crea una para
        poder entrar también con tu correo.
      </Text>

      <View style={styles.emailBox}>
        <Text style={styles.emailLabel}>Tu correo</Text>
        <Text style={styles.emailValue}>{session?.user.email}</Text>
      </View>

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPass}
        placeholder="Nueva contraseña"
        placeholderTextColor={colors.mute}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
      <TextInput
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirmar contraseña"
        placeholderTextColor={colors.mute}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />

      <Pressable
        style={[styles.btn, busy && styles.btnDisabled]}
        onPress={guardar}
        disabled={busy}
      >
        <Text style={styles.btnText}>
          {busy ? "Guardando…" : "Guardar contraseña"}
        </Text>
      </Pressable>

      <Text style={styles.hint}>
        Seguirás pudiendo entrar con Google: es la misma cuenta.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950, padding: 20, gap: 12 },
  intro: { color: colors.mute, fontSize: 14, lineHeight: 20 },
  emailBox: {
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: 14,
    padding: 16,
  },
  emailLabel: { color: colors.mute, fontSize: 12 },
  emailValue: { color: colors.bone, fontSize: 16, fontWeight: "600", marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.bone,
    fontSize: 16,
  },
  btn: {
    backgroundColor: colors.trail500,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: { color: colors.ink950, fontSize: 16, fontWeight: "800" },
  btnDisabled: { opacity: 0.6 },
  hint: { color: colors.mute, fontSize: 12, textAlign: "center" },
});
