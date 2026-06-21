import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

type Row = {
  id: string;
  name: string;
  state: string;
  level: string;
  distance_km: number | null;
  status: string;
  calificada: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Publicada",
  oculta: "Oculta",
  pending: "En revisión",
  rejected: "Rechazada",
};

export default function MisRutas() {
  const { session } = useAuth();
  const [routes, setRoutes] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from("user_routes")
      .select("id, name, state, level, distance_km, status, calificada")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setRoutes((data as Row[] | null) ?? []);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
      contentContainerStyle={{ padding: 20, gap: 12 }}
      data={routes}
      keyExtractor={(r) => r.id}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>Todavía no has grabado ninguna ruta.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {item.calificada ? "★ " : ""}
              {item.name}
            </Text>
            <Text style={styles.meta}>
              {item.state} · {item.level} · {item.distance_km != null ? `${item.distance_km} km` : "—"}
            </Text>
          </View>
          <Text style={styles.status}>{STATUS_LABEL[item.status] ?? item.status}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  empty: { color: colors.mute, textAlign: "center", marginTop: 48, fontSize: 15 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: 14,
    padding: 16,
  },
  name: { color: colors.bone, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.mute, fontSize: 13, marginTop: 4 },
  status: {
    color: colors.trail400,
    fontSize: 12,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
