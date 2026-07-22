import { useEffect, useRef } from "react";
import { View, ActivityIndicator, AppState } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { AuthProvider, useAuth, BYPASS_AUTH } from "@/lib/auth";
import { CartProvider } from "@/lib/cart-context";
import HeaderBackHome from "@/components/HeaderBackHome";
import { colors } from "@/lib/theme";
import { syncPendingActivities } from "@/lib/offline";
import { getActiveRecording } from "@/lib/tracking";

function RootNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const resumeChecked = useRef(false);

  useEffect(() => {
    if (loading || BYPASS_AUTH) return;
    const inLogin = segments[0] === "login";
    if (!session && !inLogin) router.replace("/login");
    else if (session && inLogin) router.replace("/");
  }, [session, loading, segments]);

  // Recuperación de grabación: si la app se cerró (o el SO la relanzó) a mitad de
  // un recorrido, al volver a entrar regresamos a la pantalla correspondiente en
  // modo "reanudar". Solo en el arranque en frío; con la app viva, cada pantalla
  // se reengancha sola.
  useEffect(() => {
    if (!session || resumeChecked.current) return;
    resumeChecked.current = true;
    getActiveRecording()
      .then((rec) => {
        if (!rec) return;
        if (rec.context.kind === "route") {
          router.push(`/hacer-ruta/${rec.context.routeId}?resume=1`);
        } else {
          router.push("/(tabs)/grabar?resume=1");
        }
      })
      .catch(() => undefined);
  }, [session]);

  // Sube las actividades grabadas sin conexión: al iniciar con sesión y cada vez
  // que la app vuelve a primer plano (donde suele recuperarse la señal).
  useEffect(() => {
    if (!session) return;
    syncPendingActivities().catch(() => undefined);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncPendingActivities().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [session]);

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
      {/* El title alimenta la etiqueta del botón atrás de las pantallas que se
          apilan encima; sin él se leería "(tabs)". */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Inicio" }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="ruta/[id]" options={{ title: "Ruta" }} />
      <Stack.Screen name="hacer-ruta/[id]" options={{ title: "Hacer ruta" }} />
      <Stack.Screen name="comunidad/[id]" options={{ title: "Publicación" }} />
      <Stack.Screen name="eventos" options={{ title: "Eventos" }} />
      <Stack.Screen name="marketplace" options={{ title: "Marketplace" }} />
      <Stack.Screen name="producto/[id]" options={{ title: "Producto" }} />
      <Stack.Screen name="carrito" options={{ title: "Carrito" }} />
      <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
      {/* Sin retroceso al checkout: la única salida es Inicio. */}
      <Stack.Screen
        name="pedido-exito"
        options={{ title: "", headerBackVisible: false, headerLeft: () => <HeaderBackHome /> }}
      />
      <Stack.Screen name="talleres" options={{ title: "Talleres 4×4" }} />
      <Stack.Screen name="proveedor/[id]" options={{ title: "Proveedor" }} />
      <Stack.Screen name="mis-actividades" options={{ title: "Mis actividades" }} />
      <Stack.Screen name="mis-rutas" options={{ title: "Mis rutas" }} />
      <Stack.Screen name="descargadas" options={{ title: "Rutas descargadas" }} />
      <Stack.Screen name="crear-contrasena" options={{ title: "Contraseña de acceso" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink950, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="light" />
          <RootNav />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
