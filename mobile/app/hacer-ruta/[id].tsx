import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { NavMapWebView } from "@/components/NavMapWebView";
import { trackDistanceKm, type Point } from "@/lib/geo";
import { guardarActividad, type Waypoint } from "@/lib/activities";
import { startTracking, stopTracking, subscribe, getTrack } from "@/lib/tracking";

type RouteRow = {
  id: string;
  name: string;
  track: Point[] | null;
  waypoints: Waypoint[] | null;
};

export default function HacerRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [route, setRoute] = useState<RouteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTrack, setUserTrack] = useState<Point[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(0);
  const finished = useRef(false);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session]);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from("user_routes")
        .select("id, name, track, waypoints")
        .eq("id", id)
        .single<RouteRow>();
      setRoute(data ?? null);
      setLoading(false);

      if (!session || !data) return;

      const err = await startTracking();
      if (err) {
        Alert.alert("Permiso necesario", err, [{ text: "OK", onPress: () => router.back() }]);
        return;
      }
      setRecording(true);
      startedAt.current = Date.now();
      timer.current = setInterval(
        () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)),
        1000
      );
      unsub = subscribe((t) => setUserTrack([...t]));
      setUserTrack([...getTrack()]);
    })();

    return () => {
      unsub();
      if (timer.current) clearInterval(timer.current);
      // Si el usuario salió sin "Terminar", cortamos la grabación de fondo.
      if (!finished.current) stopTracking().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const position: Point | null = userTrack.length ? userTrack[userTrack.length - 1] : null;
  const distance = trackDistanceKm(userTrack);
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  async function terminar() {
    if (!session) return;

    if (getTrack().length < 2) {
      Alert.alert(
        "Recorrido muy corto",
        "Aún no se grabó suficiente recorrido. Sigue avanzando o descarta.",
        [
          { text: "Seguir", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: async () => {
              finished.current = true;
              if (timer.current) clearInterval(timer.current);
              await stopTracking();
              router.back();
            },
          },
        ]
      );
      return;
    }

    finished.current = true;
    if (timer.current) clearInterval(timer.current);
    const finalTrack = await stopTracking();
    setRecording(false);
    setSaving(true);
    const { error } = await guardarActividad({
      userId: session.user.id,
      title: route?.name ? `Recorrido: ${route.name}` : null,
      track: finalTrack,
      waypoints: [],
      durationS: elapsed,
      startedAt: new Date(startedAt.current || Date.now()).toISOString(),
    });
    setSaving(false);
    if (error) return Alert.alert("Error", error);
    Alert.alert("Guardado", "Tu recorrido quedó en tu historial.", [
      { text: "OK", onPress: () => router.replace("/mis-actividades") },
    ]);
  }

  function descartar() {
    Alert.alert(
      "¿Descartar recorrido?",
      "Esto no se guardará en tu historial.",
      [
        { text: "Seguir grabando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            finished.current = true;
            if (timer.current) clearInterval(timer.current);
            await stopTracking();
            router.back();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }
  if (!route) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.mute}>Ruta no encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavMapWebView
        routeTrack={route.track ?? []}
        waypoints={route.waypoints ?? []}
        userTrack={userTrack}
        position={position}
      />

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.statsRow}>
          <Stat label="Distancia" value={`${distance.toFixed(2)} km`} />
          <Stat label="Tiempo" value={formatTime(elapsed)} />
          <Stat label="Puntos" value={String(userTrack.length)} />
        </View>
        <Text style={[styles.live, recording && { color: colors.trail400 }]}>
          {recording ? "● Grabando tu recorrido…" : "Grabación detenida"}
        </Text>
        <Pressable
          style={[styles.btnStop, saving && { opacity: 0.6 }]}
          onPress={terminar}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.ink950} />
          ) : (
            <Text style={styles.btnStopText}>Terminar y guardar</Text>
          )}
        </Pressable>
        <Pressable style={styles.btnDiscard} onPress={descartar} disabled={saving}>
          <Text style={styles.btnDiscardText}>Descartar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  mute: { color: colors.mute },
  panel: {
    backgroundColor: colors.ink900,
    borderTopWidth: 1,
    borderTopColor: colors.ink700,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink950,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  statLabel: { color: colors.mute, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { color: colors.bone, fontSize: 18, fontWeight: "800", marginTop: 4 },
  live: { color: colors.mute, fontSize: 13, textAlign: "center", fontWeight: "600" },
  btnStop: { backgroundColor: colors.trail500, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnStopText: { color: colors.ink950, fontSize: 16, fontWeight: "700" },
  btnDiscard: { borderWidth: 1, borderColor: colors.ink600, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnDiscardText: { color: colors.bone, fontSize: 16, fontWeight: "600" },
});
