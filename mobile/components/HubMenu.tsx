import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type HubItem = {
  key: string;
  label: string;
  blurb: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const GRID_ITEMS: HubItem[] = [
  { key: "rutas", label: "Rutas", blurb: "Descubre y navega", icon: "map", route: "/(tabs)/rutas" },
  { key: "eventos", label: "Eventos", blurb: "Próximas salidas", icon: "calendar", route: "/eventos" },
  { key: "marketplace", label: "Marketplace", blurb: "Equipo y accesorios", icon: "cart", route: "/marketplace" },
  { key: "talleres", label: "Talleres", blurb: "Servicios 4×4", icon: "construct", route: "/talleres" },
  { key: "perfil", label: "Perfil", blurb: "Tu cuenta", icon: "person-circle", route: "/(tabs)/perfil" },
  { key: "comunidad", label: "Comunidad", blurb: "Publica y conecta", icon: "chatbubbles", route: "/(tabs)" },
];

// Menú a pantalla completa con todos los accesos de la app. Se abre al tocar
// el botón Inicio de la barra inferior (único tab visible).
export function HubMenu({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function go(route: string) {
    onClose();
    router.navigate(route as never);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <View style={styles.eyebrowRow}>
            <View style={styles.dot} />
            <Text style={styles.eyebrow}>Explora</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.bone} />
          </Pressable>
        </View>
        <Text style={styles.title}>LÍNEA BRAVA</Text>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {GRID_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => go(item.route)}
              >
                <View style={styles.iconChip}>
                  <Ionicons name={item.icon} size={30} color={colors.trail500} />
                </View>
                <Text style={styles.cardLabel} numberOfLines={2}>
                  {item.label}
                </Text>
                <Text style={styles.cardBlurb} numberOfLines={2}>
                  {item.blurb}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Grabar: acción principal, destacada */}
          <Pressable
            style={({ pressed }) => [styles.recordCard, pressed && styles.recordCardPressed]}
            onPress={() => go("/(tabs)/grabar")}
          >
            <View style={styles.recordIconChip}>
              <Ionicons name="radio-button-on" size={28} color={colors.ink950} />
            </View>
            <View style={styles.recordBody}>
              <Text style={styles.recordLabel}>Grabar ruta</Text>
              <Text style={styles.recordBlurb}>Inicia el registro de tu recorrido</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink950} />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink950,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.trail500,
  },
  eyebrow: {
    color: colors.mute,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 34,
    color: colors.bone,
    marginTop: 8,
    marginBottom: 16,
  },
  scroll: { paddingBottom: 24 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "31%",
    flexGrow: 1,
    minHeight: 140,
    backgroundColor: colors.ink900,
    borderWidth: 1.5,
    borderColor: colors.trail500,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardPressed: {
    backgroundColor: colors.ink800,
    borderColor: colors.trail400,
    transform: [{ scale: 0.96 }],
  },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(245,130,31,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    marginTop: 8,
    color: colors.bone,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  cardBlurb: {
    marginTop: 3,
    color: colors.mute,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  recordCard: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.trail500,
    borderRadius: 16,
    padding: 16,
  },
  recordCardPressed: {
    backgroundColor: colors.trail400,
    transform: [{ scale: 0.98 }],
  },
  recordIconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(11,12,14,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordBody: { flex: 1 },
  recordLabel: {
    color: colors.ink950,
    fontSize: 16,
    fontWeight: "800",
  },
  recordBlurb: {
    marginTop: 2,
    color: "rgba(11,12,14,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
});
