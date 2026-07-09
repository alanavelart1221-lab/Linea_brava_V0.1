import { useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { HubMenu } from "@/components/HubMenu";

export default function TabsLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink900 },
          headerTintColor: colors.bone,
          headerTitleStyle: { color: colors.bone },
          tabBarStyle: { backgroundColor: colors.ink900, borderTopColor: colors.ink700 },
          tabBarActiveTintColor: colors.trail400,
          tabBarInactiveTintColor: colors.mute,
          sceneStyle: { backgroundColor: colors.ink950 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
          listeners={{
            // El botón Inicio no navega: abre el menú de accesos a pantalla completa.
            tabPress: (e) => {
              e.preventDefault();
              setMenuOpen(true);
            },
          }}
        />
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
