import { useCallback, useLayoutEffect, useMemo, useState } from "react";
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
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";
import CartButton from "@/components/CartButton";

type Row = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  category: string | null;
  provider_id: string;
  provider_name: string;
};

export default function Marketplace() {
  const router = useRouter();
  const navigation = useNavigation();
  const [products, setProducts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <CartButton /> });
  }, [navigation]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("provider_products")
      .select(
        "id, name, description, price, currency, image_url, category, provider_id, providers!inner(name, estado)"
      )
      .eq("active", true)
      .in("providers.estado", ["en_prueba", "activo"])
      .order("created_at", { ascending: false })
      .limit(300);

    type Raw = Omit<Row, "provider_name"> & {
      providers: { name: string } | { name: string }[] | null;
    };
    setProducts(
      (((data as unknown) as Raw[] | null) ?? []).map((row) => {
        const prov = Array.isArray(row.providers) ? row.providers[0] : row.providers;
        return {
          id: row.id,
          name: row.name,
          description: row.description,
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

  const categorias = useMemo(
    () => [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))].sort(),
    [products]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoria && p.category !== categoria) return false;
      if (!q) return true;
      return [p.name, p.category ?? "", p.provider_name, p.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, query, categoria]);

  const hasFilters = query.trim().length > 0 || categoria !== null;

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
      data={results}
      keyExtractor={(p) => p.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar producto, categoría o proveedor…"
            placeholderTextColor={colors.mute}
          />
          {categorias.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
            >
              <Pressable
                style={[styles.catChip, categoria === null && styles.catChipActive]}
                onPress={() => setCategoria(null)}
              >
                <Text style={[styles.catChipText, categoria === null && styles.catChipTextActive]}>
                  Todas las categorías
                </Text>
              </Pressable>
              {categorias.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.catChip, categoria === c && styles.catChipActive]}
                  onPress={() => setCategoria(categoria === c ? null : c)}
                >
                  <Text style={[styles.catChipText, categoria === c && styles.catChipTextActive]}>
                    {c}
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
              <Text style={styles.emptySubtitle}>Prueba con otra categoría o palabra clave.</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>Aún no hay productos publicados.</Text>
              <Text style={styles.emptySubtitle}>Los proveedores están subiendo su catálogo.</Text>
            </>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/producto/${item.id}`)}>
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
  catRow: { gap: 8 },
  catChip: {
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catChipActive: {
    borderColor: colors.trail400,
    backgroundColor: "rgba(247,154,66,0.12)",
  },
  catChipText: { color: colors.mute, fontSize: 12, fontWeight: "600" },
  catChipTextActive: { color: colors.trail400 },
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
