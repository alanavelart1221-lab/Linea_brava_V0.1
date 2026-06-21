import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { colors } from "@/lib/theme";
import { fetchThreads, type Thread } from "@/lib/forum";

export default function Foro() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setThreads(await fetchThreads());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={threads}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay hilos. Crea el primero.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/foro/${item.id}`)}>
            <Text style={styles.cat}>{item.category}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.author_name} · ♥ {item.like_count}
            </Text>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push("/foro/nuevo")}>
        <Text style={styles.fabText}>+ Nuevo hilo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  empty: { color: colors.mute, textAlign: "center", marginTop: 40 },
  card: { borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 14, padding: 16 },
  cat: { color: colors.mute, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  title: { color: colors.bone, fontSize: 17, fontWeight: "700", marginTop: 4 },
  meta: { color: colors.mute, fontSize: 12, marginTop: 8 },
  fab: { position: "absolute", right: 20, bottom: 24, backgroundColor: colors.trail500, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999 },
  fabText: { color: colors.ink950, fontWeight: "800" },
});
