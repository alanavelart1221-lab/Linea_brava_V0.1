import { Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

// Flecha de regreso a Inicio para pantallas sin botón de retroceso propio:
// las pestañas (que el stack no apila) y la de pedido registrado.
export default function HeaderBackHome() {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
      hitSlop={10}
      onPress={() => router.navigate("/(tabs)")}
    >
      <Ionicons name="chevron-back" size={24} color={colors.bone} />
      <Text style={styles.label}>Inicio</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingRight: 8,
  },
  label: {
    color: colors.bone,
    fontSize: 16,
  },
});
