import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/lib/cart-context";
import { colors } from "@/lib/theme";

type Props = {
  productId: string;
  providerId: string;
  providerName: string;
  name: string;
  price: number | null;
  imageUrl: string | null;
  stock?: number | null;
  // "full": botón grande de ancho completo. "compact": botón pequeño para filas.
  variant?: "full" | "compact";
};

export default function AddToCartButton({
  productId,
  providerId,
  providerName,
  name,
  price,
  imageUrl,
  stock,
  variant = "full",
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const sinPrecio = price == null;
  const agotado = stock != null && stock <= 0;
  const disabled = sinPrecio || agotado;

  const compact = variant === "compact";

  if (disabled) {
    return (
      <Text style={[styles.unavailable, compact && styles.unavailableCompact]}>
        {agotado ? "Agotado" : "No disponible"}
      </Text>
    );
  }

  function onPress() {
    addItem({ productId, providerId, providerName, name, price: price as number, imageUrl });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <Pressable
      style={[styles.btn, compact ? styles.btnCompact : styles.btnFull, added && styles.btnAdded]}
      onPress={onPress}
    >
      <Ionicons
        name={added ? "checkmark" : "cart-outline"}
        size={compact ? 16 : 18}
        color={colors.ink950}
      />
      <Text style={[styles.text, compact && styles.textCompact]}>
        {added ? "Agregado" : compact ? "Agregar" : "Agregar al carrito"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.trail500,
    borderRadius: 999,
  },
  btnFull: { paddingVertical: 14, paddingHorizontal: 20 },
  btnCompact: { paddingVertical: 8, paddingHorizontal: 14, gap: 6 },
  btnAdded: { backgroundColor: colors.go500 },
  text: { color: colors.ink950, fontWeight: "700", fontSize: 15 },
  textCompact: { fontSize: 13 },
  unavailable: {
    color: colors.mute,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 14,
  },
  unavailableCompact: { fontSize: 12, paddingVertical: 8 },
});
