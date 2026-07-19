import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { loadHomeData, type HomeData } from "@/lib/homeData";
import { getActiveRecording } from "@/lib/tracking";
import { getDestacado, type Destacado } from "@/lib/destacado";
import { relativeTime } from "@/lib/relativeTime";
import { DestacadoCard, DestacadoCardSkeleton } from "@/components/DestacadoCard";

type GridItem = {
  key: string;
  label: string;
  fallback: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  chipBg: string;
};

const GRID_ITEMS: GridItem[] = [
  { key: "rutas", label: "Rutas", fallback: "Descubre y navega", icon: "map", route: "/(tabs)/rutas", color: colors.go400, chipBg: "rgba(52,211,153,0.14)" },
  { key: "eventos", label: "Eventos", fallback: "Próximas salidas", icon: "calendar", route: "/eventos", color: colors.trail400, chipBg: "rgba(247,154,66,0.14)" },
  { key: "marketplace", label: "Marketplace", fallback: "Equipo y accesorios", icon: "cart", route: "/marketplace", color: colors.trail300, chipBg: "rgba(249,178,109,0.14)" },
  { key: "talleres", label: "Talleres", fallback: "Servicio 4×4 por zona", icon: "construct", route: "/talleres", color: colors.trail500, chipBg: "rgba(245,130,31,0.14)" },
  { key: "comunidad", label: "Comunidad", fallback: "Publica y conecta", icon: "chatbubbles", route: "/(tabs)/comunidad", color: colors.go500, chipBg: "rgba(16,185,129,0.14)" },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

// Tarjeta del grid con entrada animada (fade + subida) escalonada por índice.
function HubCard({ item, subtitle, index, onPress }: { item: GridItem; subtitle: string; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: 200 + index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { borderColor: pressed ? item.color : colors.ink700 },
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
      >
        <View style={[styles.iconChip, { backgroundColor: item.chipBg }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <Text style={styles.cardLabel}>{item.label}</Text>
        <Text style={styles.cardBlurb} numberOfLines={1}>
          {subtitle}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Pantalla de Inicio: saludo, hero de grabación, accesos con datos vivos y
// ruta destacada. Es lo primero que se ve al entrar a la app.
export default function Inicio() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [data, setData] = useState<HomeData | null>(null);
  const [hasActiveRec, setHasActiveRec] = useState(false);
  const [destacado, setDestacado] = useState<Destacado | null>(null);
  const [destacadoLoading, setDestacadoLoading] = useState(true);

  const meta = session?.user.user_metadata ?? {};
  const fullName: string = meta.full_name ?? session?.user.email?.split("@")[0] ?? "Explorador";
  const firstName = fullName.split(" ")[0];

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadHomeData(session?.user.id).then((d) => alive && setData(d));
      getActiveRecording().then((rec) => alive && setHasActiveRec(rec !== null));
      getDestacado().then((d) => {
        if (!alive) return;
        setDestacado(d);
        setDestacadoLoading(false);
      });
      return () => {
        alive = false;
      };
    }, [session?.user.id])
  );

  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const routeAnim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 420,
      delay: 100,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();

    Animated.timing(routeAnim, {
      toValue: 1,
      duration: 420,
      delay: 200 + GRID_ITEMS.length * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Pulso sutil e infinito en el chip GPS del hero para atraer la mirada.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [headerAnim, heroAnim, routeAnim, pulse]);

  function go(route: string) {
    router.navigate(route as never);
  }

  function subtitleFor(key: string): string {
    const item = GRID_ITEMS.find((i) => i.key === key)!;
    if (!data) return item.fallback;
    switch (key) {
      case "rutas":
        return data.routesCount ? `${data.routesCount} disponibles` : item.fallback;
      case "eventos":
        if (!data.nextEvent) return item.fallback;
        return data.nextEvent.daysAway === 0
          ? `${data.nextEvent.title} hoy`
          : `${data.nextEvent.title} en ${data.nextEvent.daysAway} días`;
      case "marketplace":
        return data.productsCount ? `${data.productsCount} anuncios` : item.fallback;
      case "talleres":
        return data.talleresCount ? `${data.talleresCount} talleres` : item.fallback;
      case "comunidad":
        return data.postsToday ? `${data.postsToday} publicaciones hoy` : item.fallback;
      default:
        return item.fallback;
    }
  }

  const heroStatus = hasActiveRec
    ? "Grabación en curso · toca para continuar"
    : data?.lastActivityAt
      ? `GPS listo · última ruta ${relativeTime(data.lastActivityAt)}`
      : session
        ? "GPS listo · graba tu primera ruta"
        : "GPS listo";

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header: logo + perfil, saludo */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
          }}
        >
          <View style={styles.topRow}>
            <Image source={require("../../assets/brand/logo.png")} style={styles.logo} resizeMode="contain" />
            <Pressable
              style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}
              onPress={() => go("/(tabs)/perfil")}
            >
              {meta.avatar_url ? (
                <Image source={{ uri: meta.avatar_url }} style={styles.avatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={30} color={colors.mute} />
              )}
            </Pressable>
          </View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{firstName}</Text>
        </Animated.View>

        {/* Hero: grabar ruta */}
        <Animated.View
          style={{
            opacity: heroAnim,
            transform: [{ scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          }}
        >
          <Pressable
            style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
            onPress={() => go("/(tabs)/grabar")}
          >
            <Text style={styles.heroEyebrow}>{hasActiveRec ? "Grabación activa" : "Listo para rodar"}</Text>
            <Text style={styles.heroTitle}>
              {hasActiveRec ? "Continúa tu recorrido" : "Graba tu próxima ruta"}
            </Text>
            <View style={styles.heroRow}>
              <View style={styles.heroChip}>
                <Animated.View
                  style={[
                    styles.heroPulse,
                    {
                      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
                      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                    },
                  ]}
                />
                <Ionicons name="navigate" size={22} color={colors.ink950} />
              </View>
              <Text style={styles.heroStatus} numberOfLines={1}>
                {heroStatus}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Grid 2×2 de accesos */}
        <View style={styles.grid}>
          {GRID_ITEMS.map((item, index) => (
            <HubCard
              key={item.key}
              item={item}
              subtitle={subtitleFor(item.key)}
              index={index}
              onPress={() => go(item.route)}
            />
          ))}
        </View>

        {/* Destacado: mejor post de comunidad o último video de YouTube. */}
        {(destacadoLoading || destacado) && (
          <Animated.View
            style={{
              opacity: routeAnim,
              transform: [{ translateY: routeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Destacado</Text>
              <Pressable onPress={() => go("/(tabs)/comunidad")} hitSlop={8}>
                <Text style={styles.sectionLink}>Ver todas</Text>
              </Pressable>
            </View>
            {destacado ? (
              <DestacadoCard
                item={destacado}
                onPress={() =>
                  destacado.kind === "post"
                    ? go(`/comunidad/${destacado.id}`)
                    : Linking.openURL(destacado.watchUrl).catch(() => {})
                }
              />
            ) : (
              <DestacadoCardSkeleton />
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink950,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: 84, height: 26 },
  profileBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink600,
  },
  greeting: {
    marginTop: 14,
    color: colors.mute,
    fontSize: 15,
  },
  name: {
    color: colors.bone,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 16,
  },
  hero: {
    backgroundColor: colors.pine900,
    borderWidth: 1,
    borderColor: colors.pine800,
    borderRadius: 20,
    padding: 20,
  },
  heroPressed: {
    backgroundColor: colors.pine800,
    transform: [{ scale: 0.98 }],
  },
  heroEyebrow: {
    color: colors.go400,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: colors.bone,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  heroChip: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.go500,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.go500,
  },
  heroStatus: {
    flex: 1,
    color: colors.go400,
    fontSize: 14,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  cardWrap: {
    width: "47%",
    maxWidth: "48%",
    flexGrow: 1,
  },
  card: {
    minHeight: 120,
    backgroundColor: colors.ink900,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    justifyContent: "flex-start",
  },
  cardPressed: {
    backgroundColor: colors.ink800,
    transform: [{ scale: 0.95 }],
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    marginTop: 10,
    color: colors.bone,
    fontSize: 15,
    fontWeight: "800",
  },
  cardBlurb: {
    marginTop: 3,
    color: colors.mute,
    fontSize: 12,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.bone,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionLink: {
    color: colors.trail400,
    fontSize: 13,
    fontWeight: "700",
  },
});
