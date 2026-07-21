import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

export default function PedidoExito() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark" size={44} color={colors.ink950} />
      </View>
      <Text style={styles.title}>¡Pedido registrado!</Text>
      <Text style={styles.sub}>
        Tu pedido quedó guardado. El pago en línea (Mercado Pago) estará disponible pronto;
        mientras tanto, el proveedor te contactará para coordinar.
      </Text>
      <Pressable style={styles.btnPrimary} onPress={() => router.replace("/marketplace")}>
        <Text style={styles.btnPrimaryText}>Seguir explorando</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink950,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 28,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: colors.go500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { color: colors.bone, fontSize: 24, fontWeight: "800" },
  sub: { color: colors.mute, fontSize: 15, lineHeight: 22, textAlign: "center" },
  btnPrimary: {
    backgroundColor: colors.trail500,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  btnPrimaryText: { color: colors.ink950, fontWeight: "700", fontSize: 15 },
});
