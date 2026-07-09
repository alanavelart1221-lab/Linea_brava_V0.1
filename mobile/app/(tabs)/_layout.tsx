import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { HubMenu } from "@/components/HubMenu";

export default function TabsLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink900 },
          headerTintColor: colors.bone,
          headerTitleStyle: { color: colors.bone },
          sceneStyle: { backgroundColor: colors.ink950 },
        }}
        // Barra inferior personalizada: un único botón de ancho completo que
        // abre el menú de accesos a pantalla completa.
        tabBar={() => (
          <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable style={styles.homeBtn} onPress={() => setMenuOpen(true)}>
              <Ionicons name="home" size={18} color={colors.ink950} />
              <Text style={styles.homeBtnText}>Inicio</Text>
            </Pressable>
          </View>
        )}
      >
        <Tabs.Screen name="index" options={{ title: "Inicio" }} />
        {/* Rutas ocultas de la barra: se llega a ellas desde el menú. */}
        <Tabs.Screen name="rutas" options={{ href: null, title: "Rutas" }} />
        <Tabs.Screen name="grabar" options={{ href: null, title: "Grabar" }} />
        <Tabs.Screen name="proveedores" options={{ href: null, title: "Proveedores" }} />
        <Tabs.Screen name="perfil" options={{ href: null, title: "Perfil" }} />
      </Tabs>
      <HubMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.ink900,
    borderTopWidth: 1,
    borderTopColor: colors.ink700,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
    backgroundColor: colors.trail500,
    borderRadius: 999,
    paddingVertical: 14,
  },
  homeBtnText: {
    color: colors.ink950,
    fontSize: 16,
    fontWeight: "800",
  },
});
