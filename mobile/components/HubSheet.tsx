import { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

export const HUB_BAR_HEIGHT = 48;

type Props = {
  onComunidadPress: () => void;
};

type HubItem = {
  key: string;
  label: string;
  blurb: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  fullWidth?: boolean;
};

const ITEMS: HubItem[] = [
  { key: "rutas", label: "Rutas", blurb: "Descubre y navega", icon: "map", route: "/(tabs)/rutas" },
  { key: "eventos", label: "Eventos", blurb: "Próximas salidas", icon: "calendar", route: "/eventos" },
  { key: "marketplace", label: "Marketplace", blurb: "Equipo y accesorios", icon: "cart", route: "/marketplace" },
  { key: "talleres", label: "Talleres", blurb: "Servicios 4×4", icon: "construct", route: "/talleres" },
  { key: "comunidad", label: "Comunidad", blurb: "Publica y conecta con la banda", icon: "chatbubbles", fullWidth: true },
];

// Bottom sheet propio con Animated + PanResponder (sin dependencias nuevas):
// una barrita "Explora" siempre visible que al deslizarse (o tocarse) revela
// la cuadrícula de accesos rápidos.
export function HubSheet({ onComunidadPress }: Props) {
  const router = useRouter();
  const { height: windowH } = useWindowDimensions();
  const sheetHeight = Math.round(windowH * 0.55);
  const closedY = sheetHeight - HUB_BAR_HEIGHT;

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const translateY = useRef(new Animated.Value(closedY)).current;
  const currentY = useRef(closedY);

  function snapTo(nextOpen: boolean) {
    openRef.current = nextOpen;
    setOpen(nextOpen);
    const toValue = nextOpen ? 0 : closedY;
    currentY.current = toValue;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
      speed: 16,
    }).start();
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => {
        const base = openRef.current ? 0 : closedY;
        const next = Math.min(Math.max(base + g.dy, 0), closedY);
        currentY.current = next;
        translateY.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        // Movimiento mínimo = tap sobre la barrita → alterna.
        if (Math.abs(g.dy) < 8 && Math.abs(g.vy) < 0.3) {
          snapTo(!openRef.current);
          return;
        }
        if (Math.abs(g.vy) > 0.5) {
          snapTo(g.vy < 0);
          return;
        }
        snapTo(currentY.current < closedY / 2);
      },
    })
  ).current;

  function onItemPress(item: HubItem) {
    snapTo(false);
    if (item.key === "comunidad") {
      onComunidadPress();
      return;
    }
    if (item.route) router.push(item.route as never);
  }

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, closedY],
    outputRange: [1, 0],
  });

  return (
    <>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={open ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => snapTo(false)} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}
      >
        <View style={styles.bar} {...pan.panHandlers}>
          <View style={styles.handle} />
          <View style={styles.barLabelRow}>
            <View style={styles.dot} />
            <Text style={styles.barLabel}>Explora</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.itemCard, item.fullWidth && styles.itemCardFull]}
              onPress={() => onItemPress(item)}
            >
              <View style={styles.itemTop}>
                <View style={styles.iconChip}>
                  <Ionicons name={item.icon} size={22} color={colors.trail500} />
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mute} />
              </View>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemBlurb} numberOfLines={1}>
                {item.blurb}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.ink900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.ink700,
  },
  bar: {
    height: HUB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.ink600,
  },
  barLabelRow: {
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
  barLabel: {
    color: colors.mute,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  itemCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: colors.ink800,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 16,
    padding: 16,
  },
  itemCardFull: {
    width: "100%",
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(245,130,31,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    marginTop: 10,
    color: colors.bone,
    fontSize: 15,
    fontWeight: "800",
  },
  itemBlurb: {
    marginTop: 2,
    color: colors.mute,
    fontSize: 12,
  },
});
