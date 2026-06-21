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
import { fetchProviders, TYPE_LABEL, type Provider } from "@/lib/providers";

export default function Proveedores() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setProviders(await fetchProviders());
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
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={providers}
      keyExtractor={(p) => p.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
      ListEmptyComponent={<Text style={styles.empty}>Aún no hay proveedores publicados.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/proveedor/${item.id}`)}>
          <View style={styles.top}>
            <Text style={styles.name}>{item.name}</Text>
            {item.featured && <Text style={styles.badge}>Destacado</Text>}
          </View>
          <Text style={styles.type}>{TYPE_LABEL[item.type] ?? item.type}</Text>
          <Text style={styles.meta}>{item.city}, {item.state}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  empty: { color: colors.mute, textAlign: "center", marginTop: 40 },
  card: { borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 14, padding: 16 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { color: colors.bone, fontSize: 18, fontWeight: "700", flex: 1 },
  badge: { color: colors.trail300, fontSize: 11, fontWeight: "800" },
  type: { color: colors.trail400, fontSize: 13, fontWeight: "600", marginTop: 4 },
  meta: { color: colors.mute, fontSize: 13, marginTop: 4 },
});
