import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/lib/cart-context";
import { colors } from "@/lib/theme";

// Ícono de carrito para el header, con badge del total de artículos.
export default function CartButton() {
  const router = useRouter();
  const { totalItems } = useCart();

  return (
    <Pressable style={styles.wrap} onPress={() => router.push("/carrito")} hitSlop={8}>
      <Ionicons name="cart-outline" size={24} color={colors.bone} />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems > 99 ? "99+" : totalItems}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 6, paddingVertical: 4 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.trail500,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.ink950, fontSize: 11, fontWeight: "800" },
});
