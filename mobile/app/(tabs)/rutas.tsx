import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Row = {
  id: string;
  name: string;
  state: string;
  region: string | null;
  level: string;
  distance_km: number | null;
  calificada: boolean;
  image: string | null;
};

// Color del chip de nivel (espejo de levelMeta de la web).
const LEVEL_COLOR: Record<string, string> = {
  Verde: colors.go400,
  Azul: "#60A5FA",
  Negro: colors.bone,
  Pro: colors.trail400,
};

export default function Rutas() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("user_routes")
      .select("id, name, state, region, level, distance_km, calificada, image")
      .eq("status", "approved")
      .order("calificada", { ascending: false })
      .order("created_at", { ascending: false });
    setRoutes((data as Row[] | null) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) =>
      [r.name, r.state, r.region ?? "", r.level].join(" ").toLowerCase().includes(q)
    );
  }, [routes, query]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={results}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
      ListHeaderComponent={
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, estado o nivel…"
          placeholderTextColor={colors.mute}
        />
      }
      ListEmptyComponent={<Text style={styles.empty}>Aún no hay rutas de comunidad publicadas.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/ruta/${item.id}`)}>
          <View style={styles.hero}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.heroImg} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImg, styles.heroFallback]}>
                <Text style={styles.heroFallbackText}>{item.name}</Text>
              </View>
            )}
            <View style={styles.heroScrim} />
            <View style={[styles.levelChip, { borderColor: LEVEL_COLOR[item.level] ?? colors.mute }]}>
              <Text style={[styles.levelChipText, { color: LEVEL_COLOR[item.level] ?? colors.mute }]}>
                {item.level}
              </Text>
            </View>
            {item.calificada && <Text style={styles.badge}>★ Calificada</Text>}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.eyebrow}>
              {item.region ? `${item.region} · ` : ""}{item.state}
            </Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.level} · {item.distance_km != null ? `${item.distance_km} km` : "—"}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  search: {
    borderWidth: 1,
    borderColor: colors.ink600,
    backgroundColor: colors.ink900,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.bone,
    marginBottom: 4,
  },
  empty: { color: colors.mute, textAlign: "center", marginTop: 40 },
  card: {
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: 16,
    overflow: "hidden",
  },
  hero: { position: "relative", aspectRatio: 16 / 10, backgroundColor: colors.ink800 },
  heroImg: { width: "100%", height: "100%" },
  heroFallback: { alignItems: "center", justifyContent: "center", padding: 16 },
  heroFallbackText: { color: colors.mute, fontSize: 18, fontWeight: "800", textAlign: "center" },
  heroScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
    backgroundColor: "rgba(11,12,14,0.45)",
  },
  levelChip: {
    position: "absolute",
    left: 12,
    top: 12,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "rgba(11,12,14,0.55)",
  },
  levelChipText: { fontSize: 12, fontWeight: "800" },
  badge: {
    position: "absolute",
    right: 12,
    top: 12,
    color: colors.trail300,
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "rgba(11,12,14,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  cardBody: { padding: 16 },
  eyebrow: {
    color: colors.trail400,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  name: { color: colors.bone, fontSize: 20, fontWeight: "800", marginTop: 4 },
  meta: { color: colors.mute, fontSize: 13, marginTop: 6 },
});
