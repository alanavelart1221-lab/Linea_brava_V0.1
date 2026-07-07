import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { FORUM_CATEGORIES, createThread } from "@/lib/forum";

export default function NuevoHilo() {
  const router = useRouter();
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(FORUM_CATEGORIES[0]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function publish() {
    if (!session) return;
    if (!title.trim() || !body.trim()) {
      return Alert.alert("Faltan datos", "Pon un título y un mensaje.");
    }
    setSending(true);
    const authorName =
      (session.user.user_metadata?.full_name as string | undefined) ??
      session.user.email?.split("@")[0] ??
      "Miembro";
    const { id, error } = await createThread({
      userId: session.user.id,
      authorName,
      title,
      body,
      category,
    });
    setSending(false);
    if (error || !id) return Alert.alert("Error", error ?? "No se pudo publicar.");
    router.replace(`/foro/${id}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Título del hilo"
        placeholderTextColor={colors.mute}
      />
      <View style={styles.cats}>
        {FORUM_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.cat, category === c && styles.catOn]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, category === c && styles.catTextOn]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[styles.input, styles.area]}
        value={body}
        onChangeText={setBody}
        placeholder="Escribe tu mensaje…"
        placeholderTextColor={colors.mute}
        multiline
      />
      <Pressable style={[styles.btn, sending && { opacity: 0.6 }]} onPress={publish} disabled={sending}>
        {sending ? <ActivityIndicator color={colors.ink950} /> : <Text style={styles.btnText}>Publicar hilo</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  input: { borderWidth: 1, borderColor: colors.ink600, backgroundColor: colors.ink900, borderRadius: 12, padding: 14, color: colors.bone, fontSize: 15 },
  area: { minHeight: 140, textAlignVertical: "top" },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cat: { borderWidth: 1, borderColor: colors.ink600, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  catOn: { borderColor: colors.trail500, backgroundColor: "rgba(245,130,31,0.15)" },
  catText: { color: colors.mute, fontWeight: "600" },
  catTextOn: { color: colors.trail400 },
  btn: { backgroundColor: colors.trail500, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnText: { color: colors.ink950, fontWeight: "700", fontSize: 16 },
});
