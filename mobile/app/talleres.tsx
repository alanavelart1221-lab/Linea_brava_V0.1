import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Row = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  specialty: string[] | null;
  logo_url: string | null;
  verificado: boolean | null;
};

export default function Talleres() {
  const router = useRouter();
  const [talleres, setTalleres] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [zona, setZona] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("providers")
      .select("id, name, city, state, description, specialty, logo_url, verificado")
      .eq("type", "taller")
      .in("estado", ["en_prueba", "activo"])
      .order("verificado", { ascending: false })
      .order("name", { ascending: true });
    setTalleres((data as Row[] | null) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const zonas = useMemo(
    () => [...new Set(talleres.map((t) => t.state).filter((s): s is string => !!s))].sort(),
    [talleres]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return talleres.filter((t) => {
      if (zona && t.state !== zona) return false;
      if (!q) return true;
      return [t.name, t.city ?? "", t.state ?? "", t.description ?? "", ...(t.specialty ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [talleres, query, zona]);

  const hasFilters = query.trim().length > 0 || zona !== null;

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
      keyExtractor={(t) => t.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar taller, ciudad o servicio…"
            placeholderTextColor={colors.mute}
          />
          {zonas.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.zonaRow}
            >
              <Pressable
                style={[styles.zonaChip, zona === null && styles.zonaChipActive]}
                onPress={() => setZona(null)}
              >
                <Text style={[styles.zonaChipText, zona === null && styles.zonaChipTextActive]}>
                  Todas las zonas
                </Text>
              </Pressable>
              {zonas.map((z) => (
                <Pressable
                  key={z}
                  style={[styles.zonaChip, zona === z && styles.zonaChipActive]}
                  onPress={() => setZona(zona === z ? null : z)}
                >
                  <Text style={[styles.zonaChipText, zona === z && styles.zonaChipTextActive]}>
                    {z}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          {hasFilters ? (
            <>
              <Text style={styles.emptyTitle}>Sin resultados para tu búsqueda.</Text>
              <Text style={styles.emptySubtitle}>Prueba con otra zona o palabra clave.</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>Aún no hay talleres registrados.</Text>
              <Text style={styles.emptySubtitle}>Pronto encontrarás servicios 4×4 aquí.</Text>
            </>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/proveedor/${item.id}`)}>
          <View style={styles.row}>
            {item.logo_url ? (
              <Image source={{ uri: item.logo_url }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Text style={styles.logoInitial}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.body}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.verificado && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.go400} />
                )}
              </View>
              {(item.city || item.state) && (
                <Text style={styles.location} numberOfLines={1}>
                  {[item.city, item.state].filter(Boolean).join(", ")}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mute} />
          </View>
          {!!item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {(item.specialty ?? []).length > 0 && (
            <View style={styles.chips}>
              {(item.specialty ?? []).slice(0, 3).map((s) => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  header: { gap: 10, marginBottom: 4 },
  search: {
    borderWidth: 1,
    borderColor: colors.ink600,
    backgroundColor: colors.ink900,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.bone,
  },
  zonaRow: { gap: 8 },
  zonaChip: {
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zonaChipActive: {
    borderColor: colors.trail400,
    backgroundColor: "rgba(247,154,66,0.12)",
  },
  zonaChipText: { color: colors.mute, fontSize: 12, fontWeight: "600" },
  zonaChipTextActive: { color: colors.trail400 },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 6 },
  emptyTitle: { color: colors.bone, fontSize: 16 },
  emptySubtitle: { color: colors.mute, fontSize: 13 },
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 16,
    padding: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.ink800,
  },
  logoFallback: {
    borderWidth: 1,
    borderColor: colors.ink600,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: { color: colors.trail400, fontSize: 18, fontWeight: "800" },
  body: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flexShrink: 1, color: colors.bone, fontSize: 16, fontWeight: "800" },
  location: { color: colors.mute, fontSize: 13, marginTop: 2 },
  description: {
    marginTop: 10,
    color: colors.mute,
    fontSize: 13,
    lineHeight: 18,
  },
  chips: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: colors.mute, fontSize: 11, fontWeight: "600" },
});
