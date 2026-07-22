import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import HeaderBackHome from "@/components/HeaderBackHome";

type TabItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  /** pathname que marca este tab como activo */
  match: (path: string) => boolean;
};

const TAB_ITEMS: TabItem[] = [
  { key: "inicio", label: "Inicio", icon: "home", route: "/(tabs)", match: (p) => p === "/" },
  { key: "rutas", label: "Rutas", icon: "map", route: "/(tabs)/rutas", match: (p) => p.startsWith("/rutas") },
  { key: "grabar", label: "Grabar", icon: "radio-button-on", route: "/(tabs)/grabar", match: (p) => p.startsWith("/grabar") },
  { key: "tienda", label: "Tienda", icon: "cart", route: "/marketplace", match: (p) => p.startsWith("/marketplace") },
  { key: "comunidad", label: "Comunidad", icon: "chatbubbles", route: "/(tabs)/comunidad", match: (p) => p.startsWith("/comunidad") },
];

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink900 },
        headerTintColor: colors.bone,
        headerTitleStyle: { color: colors.bone },
        sceneStyle: { backgroundColor: colors.ink950 },
        // Las pestañas no se apilan, así que no traen retroceso propio: se les
        // pone una flecha explícita hacia Inicio (index no tiene header).
        headerLeft: () => <HeaderBackHome />,
      }}
      // Barra inferior personalizada: 5 accesos con Grabar destacado al centro.
      tabBar={() => (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
          {TAB_ITEMS.map((item) => {
            const active = item.match(pathname);
            if (item.key === "grabar") {
              return (
                <Pressable
                  key={item.key}
                  style={styles.tab}
                  onPress={() => router.navigate(item.route as never)}
                >
                  <View style={[styles.recordBtn, active && styles.recordBtnActive]}>
                    <Ionicons name={item.icon} size={24} color={colors.ink950} />
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={item.key}
                style={styles.tab}
                onPress={() => router.navigate(item.route as never)}
              >
                <Ionicons
                  name={active ? item.icon : (`${item.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                  size={22}
                  color={active ? colors.trail500 : colors.mute}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", headerShown: false }} />
      {/* Ocultas del sistema de tabs nativo: la barra propia las navega. */}
      <Tabs.Screen name="comunidad" options={{ href: null, title: "Comunidad" }} />
      <Tabs.Screen name="rutas" options={{ href: null, title: "Rutas" }} />
      <Tabs.Screen name="grabar" options={{ href: null, title: "Grabar" }} />
      <Tabs.Screen name="proveedores" options={{ href: null, title: "Proveedores" }} />
      <Tabs.Screen name="perfil" options={{ href: null, title: "Perfil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.ink900,
    borderTopWidth: 1,
    borderTopColor: colors.ink700,
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabLabel: {
    color: colors.mute,
    fontSize: 11,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: colors.trail500,
    fontWeight: "800",
  },
  recordBtn: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.trail500,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
    borderWidth: 4,
    borderColor: colors.ink900,
  },
  recordBtnActive: {
    backgroundColor: colors.trail400,
  },
});
