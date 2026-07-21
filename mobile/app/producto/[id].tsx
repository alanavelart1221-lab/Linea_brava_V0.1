import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchProduct, type ProductDetail } from "@/lib/providers";
import { colors } from "@/lib/theme";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setProduct(await fetchProduct(id));
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
  if (!product) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.mute}>Producto no disponible.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons name="cube-outline" size={48} color={colors.mute} />
        </View>
      )}

      <View style={styles.body}>
        {product.category ? <Text style={styles.category}>{product.category}</Text> : null}
        <Text style={styles.name}>{product.name}</Text>

        {product.price != null ? (
          <Text style={styles.price}>
            ${product.price.toLocaleString("es-MX")} {product.currency ?? "MXN"}
          </Text>
        ) : (
          <Text style={styles.priceNa}>Precio no disponible</Text>
        )}

        {product.description ? (
          <Text style={styles.desc}>{product.description}</Text>
        ) : null}

        <View style={styles.cta}>
          <AddToCartButton
            productId={product.id}
            providerId={product.provider_id}
            providerName={product.provider_name}
            name={product.name}
            price={product.price}
            imageUrl={product.image_url}
            stock={product.stock}
          />
        </View>

        <Pressable
          style={styles.providerRow}
          onPress={() => router.push(`/proveedor/${product.provider_id}`)}
        >
          <View style={styles.providerInfo}>
            <Ionicons name="storefront-outline" size={18} color={colors.trail400} />
            <View>
              <Text style={styles.providerLabel}>Vendido por</Text>
              <Text style={styles.providerName}>{product.provider_name}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mute} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  mute: { color: colors.mute },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.ink800 },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 12 },
  category: {
    color: colors.mute,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  name: { color: colors.bone, fontSize: 24, fontWeight: "800", lineHeight: 30 },
  price: { color: colors.trail400, fontSize: 22, fontWeight: "800" },
  priceNa: { color: colors.mute, fontSize: 16 },
  desc: { color: colors.mute, fontSize: 15, lineHeight: 22, marginTop: 4 },
  cta: { marginTop: 8 },
  providerRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: 14,
    padding: 14,
  },
  providerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  providerLabel: { color: colors.mute, fontSize: 11 },
  providerName: { color: colors.bone, fontSize: 15, fontWeight: "700" },
});
