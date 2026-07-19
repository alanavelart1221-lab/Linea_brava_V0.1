import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { relativeTime } from "@/lib/relativeTime";
import type { Destacado } from "@/lib/destacado";
import { Avatar } from "./comunidad/Avatar";

const COVER_HEIGHT = 150;

type Props = {
  item: Destacado;
  onPress: () => void;
};

// Tarjeta de contenido destacado del Inicio: post de comunidad con mejor
// engagement o último video de YouTube. Mismo lenguaje visual que routeCard
// de index.tsx y PostCard de comunidad.
export function DestacadoCard({ item, onPress }: Props) {
  const isPost = item.kind === "post";
  const coverUrl = item.coverUrl;
  const showsVideo = isPost ? item.hasVideo : true;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cover}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          // Excepción: post sin foto ni miniatura posible (p. ej. video de Vimeo).
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.mute} />
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isPost ? "Lo más comentado hoy" : "Nuevo video del canal"}
          </Text>
        </View>
        {showsVideo && coverUrl && (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playCircle}>
              <Ionicons name="play" size={26} color={colors.bone} style={{ marginLeft: 3 }} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.authorRow}>
          <Avatar
            name={isPost ? item.authorName : item.channelName}
            avatarUrl={isPost ? item.authorAvatar : null}
            size="sm"
          />
          <Text style={styles.author} numberOfLines={1}>
            @{isPost ? item.authorName : item.channelName}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>
            {relativeTime(isPost ? item.createdAt : item.publishedAt)}
          </Text>
        </View>

        <Text style={styles.text} numberOfLines={2}>
          {isPost ? item.text || "Publicación con foto" : item.title}
        </Text>

        <View style={styles.metrics}>
          {isPost ? (
            <>
              <View style={styles.metric}>
                <Ionicons name="heart" size={15} color={colors.trail500} />
                <Text style={styles.metricText}>{item.likeCount}</Text>
              </View>
              <View style={styles.metric}>
                <Ionicons name="chatbubble" size={14} color={colors.trail500} />
                <Text style={styles.metricText}>{item.replyCount}</Text>
              </View>
            </>
          ) : (
            <View style={styles.metric}>
              <Ionicons name="logo-youtube" size={15} color={colors.trail500} />
              <Text style={styles.metricText}>YouTube</Text>
            </View>
          )}
          {showsVideo && (
            <View style={styles.metric}>
              <Ionicons name="videocam" size={15} color={colors.trail500} />
              <Text style={styles.metricText}>Video</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// Skeleton con las mismas dimensiones de la tarjeta para que no salte el layout.
export function DestacadoCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.cover, styles.skeletonBlock]} />
      <View style={styles.body}>
        <View style={styles.authorRow}>
          <View style={[styles.skeletonBlock, styles.skeletonAvatar]} />
          <View style={[styles.skeletonBlock, styles.skeletonLine, { width: 120 }]} />
        </View>
        <View style={[styles.skeletonBlock, styles.skeletonLine, { marginTop: 12, width: "90%" }]} />
        <View style={[styles.skeletonBlock, styles.skeletonLine, { marginTop: 8, width: "60%" }]} />
        <View style={[styles.skeletonBlock, styles.skeletonLine, { marginTop: 14, width: 100 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardPressed: {
    backgroundColor: colors.ink800,
    transform: [{ scale: 0.98 }],
  },
  cover: {
    height: COVER_HEIGHT,
    backgroundColor: colors.ink800,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(11,12,14,0.72)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.bone,
    fontSize: 11,
    fontWeight: "700",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: "rgba(11,12,14,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 14,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  author: {
    flexShrink: 1,
    color: colors.bone,
    fontSize: 13,
    fontWeight: "700",
  },
  dot: { color: colors.mute },
  time: {
    color: colors.mute,
    fontSize: 12,
  },
  text: {
    marginTop: 10,
    color: "rgba(237,233,227,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  metrics: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricText: {
    color: colors.mute,
    fontSize: 13,
    fontWeight: "600",
  },
  skeletonBlock: {
    backgroundColor: colors.ink800,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
