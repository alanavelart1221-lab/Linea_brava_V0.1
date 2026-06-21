import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
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
          title: "Rutas",
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="foro"
        options={{
          title: "Foro",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grabar"
        options={{
          title: "Grabar",
          tabBarIcon: ({ color, size }) => <Ionicons name="radio-button-on" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="proveedores"
        options={{
          title: "Proveedores",
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
