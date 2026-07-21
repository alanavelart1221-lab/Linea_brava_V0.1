import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/lib/cart-context";
import { colors } from "@/lib/theme";

export default function Carrito() {
  const router = useRouter();
  const { groups, items, totalMxn, updateQty, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="cart-outline" size={48} color={colors.mute} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySub}>Explora el marketplace y agrega productos.</Text>
        <Pressable style={styles.btnPrimary} onPress={() => router.replace("/marketplace")}>
          <Text style={styles.btnPrimaryText}>Ir al marketplace</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {groups.map((group) => (
          <View key={group.providerId} style={styles.group}>
            <Text style={styles.groupTitle}>{group.providerName}</Text>
            {group.items.map((item) => (
              <View key={item.productId} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${item.price.toLocaleString("es-MX")} MXN
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.productId, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={18} color={colors.bone} />
                  </Pressable>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.productId, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={18} color={colors.bone} />
                  </Pressable>
                </View>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeItem(item.productId)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.mute} />
                </Pressable>
              </View>
            ))}
            <Text style={styles.subtotal}>
              Subtotal: ${group.subtotal.toLocaleString("es-MX")} MXN
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalMxn.toLocaleString("es-MX")} MXN</Text>
        </View>
        <Pressable style={styles.btnPrimary} onPress={() => router.push("/checkout")}>
          <Text style={styles.btnPrimaryText}>Ir al checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  emptyTitle: { color: colors.bone, fontSize: 18, fontWeight: "700", marginTop: 4 },
  emptySub: { color: colors.mute, fontSize: 14, textAlign: "center" },
  group: {
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  groupTitle: { color: colors.trail400, fontSize: 14, fontWeight: "800" },
  item: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemName: { color: colors.bone, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  itemPrice: { color: colors.mute, fontSize: 13, marginTop: 2 },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.ink600,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBtn: { padding: 4 },
  qtyValue: { color: colors.bone, fontSize: 14, fontWeight: "700", minWidth: 18, textAlign: "center" },
  removeBtn: { padding: 4 },
  subtotal: { color: colors.mute, fontSize: 13, textAlign: "right" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink700,
    backgroundColor: colors.ink900,
    padding: 16,
    gap: 12,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { color: colors.bone, fontSize: 16, fontWeight: "600" },
  totalValue: { color: colors.trail400, fontSize: 20, fontWeight: "800" },
  btnPrimary: {
    backgroundColor: colors.trail500,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  btnPrimaryText: { color: colors.ink950, fontWeight: "700", fontSize: 15 },
});
