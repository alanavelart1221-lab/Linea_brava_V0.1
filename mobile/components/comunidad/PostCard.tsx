import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { relativeTime } from "@/lib/relativeTime";
import { togglePostLike, type Post } from "@/lib/comunidad";
import { Avatar } from "./Avatar";
import { MediaGrid } from "./MediaGrid";

type Props = {
  post: Post;
  userId: string | null;
  onPress?: () => void;
};

export function PostCard({ post, userId, onPress }: Props) {
  const [liked, setLiked] = useState(post.user_liked);
  const [count, setCount] = useState(post.like_count);
  const [busy, setBusy] = useState(false);

  async function onLike() {
    if (!userId || busy) return;
    // Toggle optimista: se revierte si la petición falla.
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));
    setBusy(true);
    try {
      await togglePostLike(post.id, userId);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
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
        {!!post.body && <Text style={styles.body}>{post.body}</Text>}
        <MediaGrid imageUrls={post.image_urls} />
      </Pressable>

      <View style={styles.footer}>
        <Pressable
          style={[styles.pill, liked && styles.pillLiked]}
          onPress={onLike}
          disabled={!userId}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={16}
            color={liked ? colors.trail400 : colors.mute}
          />
          <Text style={[styles.pillText, liked && styles.pillTextLiked]}>{count}</Text>
        </Pressable>
        <Pressable style={styles.pill} onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.mute} />
          <Text style={styles.pillText}>{post.reply_count}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  author: {
    flexShrink: 1,
    color: colors.bone,
    fontSize: 14,
    fontWeight: "700",
  },
  dot: { color: colors.mute },
  time: {
    color: colors.mute,
    fontSize: 12,
  },
  body: {
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
  pillLiked: {
    borderColor: "rgba(247,154,66,0.5)",
  },
  pillText: {
    color: colors.mute,
    fontSize: 13,
    fontWeight: "600",
  },
  pillTextLiked: {
    color: colors.trail400,
  },
});
