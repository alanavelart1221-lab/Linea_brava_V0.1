import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

function RootNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inLogin = segments[0] === "login";
    if (!session && !inLogin) router.replace("/login");
    else if (session && inLogin) router.replace("/");
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink950, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink900 },
        headerTintColor: colors.bone,
        headerTitleStyle: { color: colors.bone },
        contentStyle: { backgroundColor: colors.ink950 },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="ruta/[id]" options={{ title: "Ruta" }} />
      <Stack.Screen name="hacer-ruta/[id]" options={{ title: "Hacer ruta" }} />
      <Stack.Screen name="foro/[id]" options={{ title: "Hilo" }} />
      <Stack.Screen name="foro/nuevo" options={{ title: "Nuevo hilo" }} />
      <Stack.Screen name="proveedor/[id]" options={{ title: "Proveedor" }} />
      <Stack.Screen name="mis-actividades" options={{ title: "Mis actividades" }} />
      <Stack.Screen name="mis-rutas" options={{ title: "Mis rutas" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
