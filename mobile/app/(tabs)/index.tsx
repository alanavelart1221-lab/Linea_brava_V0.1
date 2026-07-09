import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { colors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { fetchPosts, type Post } from "@/lib/comunidad";
import { PostCard } from "@/components/comunidad/PostCard";
import { Composer, type ComposerHandle } from "@/components/comunidad/Composer";
import { HubSheet, HUB_BAR_HEIGHT } from "@/components/HubSheet";

const PAGE_SIZE = 20;

export default function Inicio() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const listRef = useRef<FlatList<Post>>(null);
  const composerRef = useRef<ComposerHandle>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (nextLimit = limit) => {
      const data = await fetchPosts(nextLimit, userId);
      setPosts(data);
      setLoading(false);
      setLoadingMore(false);
    },
    [limit, userId]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function onVerMas() {
    const next = limit + PAGE_SIZE;
    setLimit(next);
    setLoadingMore(true);
    load(next);
  }

  function onComunidadPress() {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    composerRef.current?.focus();
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        style={styles.container}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: HUB_BAR_HEIGHT + 24 }}
        data={posts}
        keyExtractor={(p) => p.id}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => load()} tintColor={colors.trail500} />
        }
        ListHeaderComponent={<Composer ref={composerRef} onPosted={() => load()} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Todavía no hay publicaciones.</Text>
            <Text style={styles.emptySubtitle}>¡Sé el primero en compartir algo!</Text>
          </View>
        }
        ListFooterComponent={
          posts.length >= limit ? (
            <Pressable style={styles.verMas} onPress={onVerMas} disabled={loadingMore}>
              <Text style={styles.verMasText}>{loadingMore ? "Cargando…" : "Ver más"}</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            userId={userId}
            onPress={() => router.push(`/comunidad/${item.id}`)}
          />
        )}
      />
      <HubSheet onComunidadPress={onComunidadPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 6,
  },
  emptyTitle: { color: colors.bone, fontSize: 16 },
  emptySubtitle: { color: colors.mute, fontSize: 13 },
  verMas: {
    alignSelf: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  verMasText: {
    color: colors.mute,
    fontSize: 14,
    fontWeight: "600",
  },
});
