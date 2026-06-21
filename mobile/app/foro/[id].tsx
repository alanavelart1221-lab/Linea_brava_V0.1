import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import {
  fetchThread,
  createReply,
  toggleThreadLike,
  toggleReplyLike,
  type Reply,
  type Thread,
} from "@/lib/forum";

export default function HiloDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [thread, setThread] = useState<(Thread & Record<string, unknown>) | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [threadLiked, setThreadLiked] = useState(false);
  const [threadLikes, setThreadLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetchThread(id, session?.user.id ?? null);
    setThread(res.thread as (Thread & Record<string, unknown>) | null);
    setReplies(res.replies);
    setThreadLiked(res.threadLiked);
    setThreadLikes(res.threadLikeCount);
    setLoading(false);
  }, [id, session]);

  useEffect(() => { load(); }, [load]);

  const authorName =
    (session?.user.user_metadata?.full_name as string | undefined) ??
    session?.user.email?.split("@")[0] ??
    "Miembro";

  async function onReply() {
    if (!session || !id) return;
    if (!body.trim()) return;
    setSending(true);
    const err = await createReply({ threadId: id, userId: session.user.id, authorName, body });
    setSending(false);
    if (err) return Alert.alert("Error", err);
    setBody("");
    load();
  }

  async function likeThread() {
    if (!session || !id) return;
    setThreadLiked((v) => !v);
    setThreadLikes((n) => n + (threadLiked ? -1 : 1));
    await toggleThreadLike(id, session.user.id);
  }

  async function likeReply(replyId: string) {
    if (!session) return;
    await toggleReplyLike(replyId, session.user.id);
    load();
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }
  if (!thread) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.mute}>Hilo no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={styles.card}>
        <Text style={styles.cat}>{thread.category as string}</Text>
        <Text style={styles.title}>{thread.title as string}</Text>
        <Text style={styles.author}>{thread.author_name as string}</Text>
        <Text style={styles.bodyText}>{thread.body as string}</Text>
        <Pressable onPress={likeThread} style={styles.likeRow}>
          <Text style={[styles.like, threadLiked && styles.likeOn]}>♥ {threadLikes}</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>
        {replies.length} {replies.length === 1 ? "respuesta" : "respuestas"}
      </Text>

      {replies.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.author}>{r.author_name}</Text>
          <Text style={styles.bodyText}>{r.body}</Text>
          <Pressable onPress={() => likeReply(r.id)} style={styles.likeRow}>
            <Text style={[styles.like, r.user_liked && styles.likeOn]}>♥ {r.like_count}</Text>
          </Pressable>
        </View>
      ))}

      {session ? (
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Escribe tu respuesta…"
            placeholderTextColor={colors.mute}
            multiline
          />
          <Pressable style={[styles.btn, sending && { opacity: 0.6 }]} onPress={onReply} disabled={sending}>
            <Text style={styles.btnText}>{sending ? "Enviando…" : "Responder"}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.mute}>Inicia sesión para responder.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  card: { borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 14, padding: 16, gap: 8 },
  cat: { color: colors.mute, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  title: { color: colors.bone, fontSize: 22, fontWeight: "800" },
  author: { color: colors.trail400, fontWeight: "700", fontSize: 13 },
  bodyText: { color: colors.mute, fontSize: 15, lineHeight: 22 },
  likeRow: { alignSelf: "flex-start", marginTop: 4 },
  like: { color: colors.mute, fontWeight: "700" },
  likeOn: { color: colors.trail400 },
  section: { color: colors.bone, fontSize: 16, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: colors.ink600, backgroundColor: colors.ink950, borderRadius: 12, padding: 12, color: colors.bone, minHeight: 70, textAlignVertical: "top" },
  btn: { backgroundColor: colors.trail500, paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  btnText: { color: colors.ink950, fontWeight: "700" },
  mute: { color: colors.mute },
});
