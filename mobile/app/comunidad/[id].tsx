import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/relativeTime";
import {
  authorInfo,
  createReply,
  fetchPost,
  MAX_BODY,
  togglePostLike,
  toggleReplyLike,
  type Post,
  type PostReply,
} from "@/lib/comunidad";
import { Avatar } from "@/components/comunidad/Avatar";
import { MediaGrid } from "@/components/comunidad/MediaGrid";

export default function Publicacion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user.id ?? null;

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<PostReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetchPost(id, userId);
    setPost(res.post);
    setReplies(res.replies);
    setLiked(res.post?.user_liked ?? false);
    setLikeCount(res.post?.like_count ?? 0);
    setLoading(false);
  }, [id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onLikePost() {
    if (!userId || !id) return;
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    try {
      await togglePostLike(id, userId);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }

  async function onLikeReply(replyId: string) {
    if (!userId) return;
    await toggleReplyLike(replyId, userId);
    load();
  }

  async function onReply() {
    if (!session || !id || !body.trim()) return;
    const { name, avatar } = authorInfo(session);
    setSending(true);
    const err = await createReply({
      postId: id,
      userId: session.user.id,
      authorName: name,
      avatar,
      body,
    });
    setSending(false);
    if (err) return Alert.alert("Error", err);
    setBody("");
    load();
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }
  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muteText}>Publicación no encontrada.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Post */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Avatar name={post.author_name} avatarUrl={post.author_avatar} />
            <View style={styles.authorRow}>
              <Text style={styles.author} numberOfLines={1}>
                {post.author_name}
              </Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.time}>{relativeTime(post.created_at)}</Text>
            </View>
          </View>
          {!!post.body && <Text style={styles.postBody}>{post.body}</Text>}
          <MediaGrid imageUrls={post.image_urls} />
          <View style={styles.footer}>
            <Pressable
              style={[styles.pill, liked && styles.pillLiked]}
              onPress={onLikePost}
              disabled={!userId}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={16}
                color={liked ? colors.trail400 : colors.mute}
              />
              <Text style={[styles.pillText, liked && styles.pillTextLiked]}>{likeCount}</Text>
            </Pressable>
            {!userId && <Text style={styles.hint}>Inicia sesión para dar like o responder.</Text>}
          </View>
        </View>

        {/* Respuestas */}
        {replies.length > 0 && (
          <Text style={styles.section}>
            {replies.length} {replies.length === 1 ? "respuesta" : "respuestas"}
          </Text>
        )}
        {replies.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.headerRow}>
              <Avatar name={r.author_name} avatarUrl={r.author_avatar} size="sm" />
              <View style={styles.authorRow}>
                <Text style={styles.author} numberOfLines={1}>
                  {r.author_name}
                </Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.time}>{relativeTime(r.created_at)}</Text>
              </View>
            </View>
            {!!r.body && <Text style={styles.replyBody}>{r.body}</Text>}
            <MediaGrid imageUrls={r.image_urls} />
            <View style={styles.footer}>
              <Pressable
                style={[styles.pill, r.user_liked && styles.pillLiked]}
                onPress={() => onLikeReply(r.id)}
                disabled={!userId}
              >
                <Ionicons
                  name={r.user_liked ? "heart" : "heart-outline"}
                  size={16}
                  color={r.user_liked ? colors.trail400 : colors.mute}
                />
                <Text style={[styles.pillText, r.user_liked && styles.pillTextLiked]}>
                  {r.like_count}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Responder */}
        {session ? (
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={body}
              onChangeText={setBody}
              placeholder="Escribe una respuesta…"
              placeholderTextColor={colors.mute}
              multiline
              maxLength={MAX_BODY}
            />
            <Pressable
              style={[styles.btn, (sending || !body.trim()) && { opacity: 0.5 }]}
              onPress={onReply}
              disabled={sending || !body.trim()}
            >
              <Text style={styles.btnText}>{sending ? "Enviando…" : "Responder"}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.card} onPress={() => router.push("/login")}>
            <Text style={styles.signInTitle}>¿Quieres responder?</Text>
            <Text style={styles.muteText}>Inicia sesión para participar en la comunidad.</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 16,
    padding: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  authorRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  author: { flexShrink: 1, color: colors.bone, fontSize: 14, fontWeight: "700" },
  dot: { color: colors.mute },
  time: { color: colors.mute, fontSize: 12 },
  postBody: {
    marginTop: 12,
    color: "rgba(237,233,227,0.9)",
    fontSize: 15,
    lineHeight: 22,
  },
  replyBody: {
    marginTop: 10,
    color: "rgba(237,233,227,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ink700,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLiked: { borderColor: "rgba(247,154,66,0.5)" },
  pillText: { color: colors.mute, fontSize: 13, fontWeight: "600" },
  pillTextLiked: { color: colors.trail400 },
  hint: { color: colors.mute, fontSize: 12, flexShrink: 1 },
  section: {
    color: colors.mute,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink600,
    backgroundColor: colors.ink950,
    borderRadius: 12,
    padding: 12,
    color: colors.bone,
    minHeight: 70,
    textAlignVertical: "top",
  },
  btn: {
    marginTop: 12,
    backgroundColor: colors.trail500,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  btnText: { color: colors.ink950, fontWeight: "800" },
  signInTitle: { color: colors.bone, fontSize: 16, fontWeight: "800", marginBottom: 4 },
  muteText: { color: colors.mute, fontSize: 13 },
});
