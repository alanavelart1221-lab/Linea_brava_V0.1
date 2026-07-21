import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { fetchProvider, TYPE_LABEL, type Provider, type ProviderProduct } from "@/lib/providers";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProveedorDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { provider, products } = await fetchProvider(id);
      setProvider(provider);
      setProducts(products);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }
  if (!provider) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.mute}>Proveedor no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.type}>{TYPE_LABEL[provider.type] ?? provider.type}</Text>
        <Text style={styles.meta}>{provider.city}, {provider.state}</Text>
      </View>

      <Text style={styles.desc}>{provider.description}</Text>

      {provider.specialty.length > 0 && (
        <View style={styles.tags}>
          {provider.specialty.map((s) => (
            <Text key={s} style={styles.tag}>{s}</Text>
          ))}
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Pressable style={styles.btnPrimary} onPress={() => Linking.openURL(`tel:${provider.phone}`)}>
          <Text style={styles.btnPrimaryText}>Llamar {provider.phone}</Text>
        </Pressable>
        {provider.website && (
          <Pressable style={styles.btnGhost} onPress={() => Linking.openURL(provider.website!)}>
            <Text style={styles.btnGhostText}>Sitio web</Text>
          </Pressable>
        )}
      </View>

      {/* Tienda */}
      <View style={styles.divider} />
      <Text style={styles.section}>Tienda / Accesorios ({products.length})</Text>
      {products.length === 0 ? (
        <Text style={styles.mute}>Este proveedor aún no ha publicado productos.</Text>
      ) : (
        products.map((p) => (
          <View key={p.id} style={styles.product}>
            <Pressable style={styles.productMain} onPress={() => router.push(`/producto/${p.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pName}>{p.name}</Text>
                {p.description ? (
                  <Text style={styles.pDesc} numberOfLines={2}>{p.description}</Text>
                ) : null}
              </View>
              {p.price != null && (
                <Text style={styles.price}>${p.price.toLocaleString("es-MX")} {p.currency}</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.mute} />
            </Pressable>
            <View style={styles.productActions}>
              <AddToCartButton
                variant="compact"
                productId={p.id}
                providerId={provider.id}
                providerName={provider.name}
                name={p.name}
                price={p.price}
                imageUrl={p.image_url}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  name: { color: colors.bone, fontSize: 26, fontWeight: "800" },
  type: { color: colors.trail400, fontSize: 14, fontWeight: "600", marginTop: 4 },
  meta: { color: colors.mute, fontSize: 13, marginTop: 4 },
  desc: { color: colors.mute, fontSize: 15, lineHeight: 22 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { color: colors.mute, fontSize: 12, borderWidth: 1, borderColor: colors.ink600, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  btnPrimary: { backgroundColor: colors.trail500, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  btnPrimaryText: { color: colors.ink950, fontWeight: "700" },
  btnGhost: { borderWidth: 1, borderColor: colors.ink600, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  btnGhostText: { color: colors.bone, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.ink700 },
  section: { color: colors.bone, fontSize: 18, fontWeight: "800" },
  mute: { color: colors.mute },
  product: { borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 14, padding: 14, gap: 12 },
  productMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  productActions: { alignItems: "flex-start" },
  pName: { color: colors.bone, fontSize: 15, fontWeight: "600" },
  pDesc: { color: colors.mute, fontSize: 13, marginTop: 2 },
  price: { color: colors.trail500, fontWeight: "800" },
});
