import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Row = {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  category: string | null;
  provider_id: string;
  provider_name: string;
};

export default function Marketplace() {
  const router = useRouter();
  const [products, setProducts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("provider_products")
      .select(
        "id, name, price, currency, image_url, category, provider_id, providers!inner(name, estado)"
      )
      .eq("active", true)
      .in("providers.estado", ["en_prueba", "activo"])
      .order("created_at", { ascending: false })
      .limit(100);

    type Raw = Omit<Row, "provider_name"> & {
      providers: { name: string } | { name: string }[] | null;
    };
    setProducts(
      (((data as unknown) as Raw[] | null) ?? []).map((row) => {
        const prov = Array.isArray(row.providers) ? row.providers[0] : row.providers;
        return {
          id: row.id,
          name: row.name,
          price: row.price,
          currency: row.currency,
          image_url: row.image_url,
          category: row.category,
          provider_id: row.provider_id,
          provider_name: prov?.name ?? "Proveedor",
        };
      })
    );
    setLoading(false);
  }, []);

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
      contentContainerStyle={{ padding: 16, gap: 12 }}
      columnWrapperStyle={{ gap: 12 }}
      numColumns={2}
      data={products}
      keyExtractor={(p) => p.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Aún no hay productos publicados.</Text>
          <Text style={styles.emptySubtitle}>Los proveedores están subiendo su catálogo.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/proveedor/${item.provider_id}`)}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="cube-outline" size={28} color={colors.mute} />
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            {item.price != null && (
              <Text style={styles.price}>
                ${item.price.toLocaleString("es-MX")} {item.currency ?? "MXN"}
              </Text>
            )}
            <Text style={styles.provider} numberOfLines={1}>
              {item.provider_name}
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
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 6 },
  emptyTitle: { color: colors.bone, fontSize: 16 },
  emptySubtitle: { color: colors.mute, fontSize: 13 },
  card: {
    flex: 1,
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.ink800,
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 12 },
  name: {
    color: colors.bone,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  price: {
    marginTop: 6,
    color: colors.trail400,
    fontSize: 14,
    fontWeight: "800",
  },
  provider: {
    marginTop: 4,
    color: colors.mute,
    fontSize: 11,
  },
});
