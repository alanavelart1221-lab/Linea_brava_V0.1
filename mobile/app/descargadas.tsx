import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { colors } from "@/lib/theme";
import { listOfflineRoutes, removeOfflineRoute, type OfflineRoute } from "@/lib/offline";

export default function Descargadas() {
  const router = useRouter();
  const [routes, setRoutes] = useState<OfflineRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setRoutes(await listOfflineRoutes());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function quitar(item: OfflineRoute) {
    Alert.alert("Quitar descarga", `¿Quitar "${item.name}" del teléfono?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: async () => {
          await removeOfflineRoute(item.id);
          load();
        },
      },
    ]);
  }

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
      ListEmptyComponent={
        <Text style={styles.empty}>
          No tienes rutas descargadas. Abre una ruta con internet y toca “Descargar para
          usar sin internet”.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.region ? `${item.region} · ` : ""}
              {item.state} · {item.level} ·{" "}
              {item.distance_km != null ? `${item.distance_km} km` : "—"}
            </Text>
          </View>
          <Pressable style={styles.btnDo} onPress={() => router.push(`/hacer-ruta/${item.id}`)}>
            <Text style={styles.btnDoText}>▶ Hacer</Text>
          </Pressable>
          <Pressable style={styles.btnDel} onPress={() => quitar(item)}>
            <Text style={styles.btnDelText}>✕</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  empty: { color: colors.mute, textAlign: "center", marginTop: 48, fontSize: 15, paddingHorizontal: 24, lineHeight: 22 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: 14,
    padding: 16,
  },
  name: { color: colors.bone, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.mute, fontSize: 13, marginTop: 4 },
  btnDo: { backgroundColor: colors.trail500, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  btnDoText: { color: colors.ink950, fontWeight: "700" },
  btnDel: { borderWidth: 1, borderColor: colors.ink600, borderRadius: 999, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  btnDelText: { color: colors.mute, fontSize: 16, fontWeight: "700" },
});
