import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  haversineKm,
  trackDistanceKm,
  routeEndpoints,
  withinRadius,
  START_RADIUS_KM,
  END_RADIUS_KM,
  type Point,
} from "@/lib/geo";
import { guardarActividad, type Waypoint } from "@/lib/activities";
import { getOfflineRoute, enqueueActivity } from "@/lib/offline";
import {
  startTracking,
  stopTracking,
  subscribe,
  getTrack,
  watchApproach,
} from "@/lib/tracking";

type RouteRow = {
  id: string;
  name: string;
  track: Point[] | null;
  waypoints: Waypoint[] | null;
};

type Phase = "approach" | "recording";

export default function HacerRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [route, setRoute] = useState<RouteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("approach");

  // Fase de aproximación: posición en vivo y si ya llegamos al inicio.
  const [approachPos, setApproachPos] = useState<Point | null>(null);
  const [arrived, setArrived] = useState(false);

  // Fase de grabación.
  const [userTrack, setUserTrack] = useState<Point[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);

  const approachSub = useRef<{ remove: () => void } | null>(null);
  const recUnsub = useRef<() => void>(() => {});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(0);
  const finished = useRef(false);
  const startedRecording = useRef(false);

  const endpoints = useMemo(() => routeEndpoints(route?.track ?? null), [route?.track]);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session]);

  // Carga de la ruta + arranque del watcher de aproximación.
  useEffect(() => {
    (async () => {
      if (!id) return;
      // Offline-first: usamos la copia descargada de inmediato y, si hay red,
      // la refrescamos con Supabase.
      const local = await getOfflineRoute(id);
      let row: RouteRow | null = local
        ? { id: local.id, name: local.name, track: local.track, waypoints: local.waypoints }
        : null;
      // Si ya tenemos copia local, la mostramos sin esperar a la red.
      if (row) {
        setRoute(row);
        setLoading(false);
      }
      const { data } = await supabase
        .from("user_routes")
        .select("id, name, track, waypoints")
        .eq("id", id)
        .single<RouteRow>();
      if (data) row = data;
      setRoute(row);
      setLoading(false);

      if (!session || !row || !routeEndpoints(row.track)) return;

      const sub = await watchApproach((p) => setApproachPos(p));
      if (typeof sub === "string") {
        Alert.alert("Permiso necesario", sub, [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }
      approachSub.current = sub;
    })();

    return () => {
      approachSub.current?.remove();
      approachSub.current = null;
      recUnsub.current();
      if (timer.current) clearInterval(timer.current);
      // Si el usuario salió sin "Terminar", cortamos la grabación de fondo.
      if (startedRecording.current && !finished.current) {
        stopTracking().catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Detección de llegada al inicio (fase de aproximación).
  const distanceToStart =
    approachPos && endpoints ? haversineKm(approachPos, endpoints.start) : null;
  useEffect(() => {
    if (phase !== "approach" || arrived) return;
    if (approachPos && endpoints && withinRadius(approachPos, endpoints.start, START_RADIUS_KM)) {
      setArrived(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approachPos, endpoints, phase]);

  // Empezar a grabar: solo cuando ya estás en el inicio de la ruta.
  async function empezar() {
    if (!session) return;
    approachSub.current?.remove();
    approachSub.current = null;

    const err = await startTracking();
    if (err) {
      Alert.alert("Permiso necesario", err);
      return;
    }
    startedRecording.current = true;
    startedAt.current = Date.now();
    setElapsed(0);
    timer.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)),
      1000
    );
    recUnsub.current = subscribe((t) => setUserTrack([...t]));
    setUserTrack([...getTrack()]);
    setRecording(true);
    setPhase("recording");
  }

  const position: Point | null =
    phase === "recording"
      ? userTrack.length
        ? userTrack[userTrack.length - 1]
        : null
      : approachPos;
  const distance = trackDistanceKm(userTrack);
  // Aviso de fin: cerca del punto final y con recorrido suficiente (evita
  // dispararse al inicio en rutas tipo bucle donde inicio ≈ fin).
  const nearEnd =
    phase === "recording" &&
    !!position &&
    !!endpoints &&
    withinRadius(position, endpoints.end, END_RADIUS_KM) &&
    distance > 0.3;

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
    const payload = {
      userId: session.user.id,
      title: route?.name ? `Recorrido: ${route.name}` : null,
      track: finalTrack,
      waypoints: [] as Waypoint[],
      durationS: elapsed,
      startedAt: new Date(startedAt.current || Date.now()).toISOString(),
    };
    const { error } = await guardarActividad(payload);
    setSaving(false);
    if (error) {
      // Sin conexión: lo guardamos en el teléfono y se sube solo al reconectar.
      await enqueueActivity(payload);
      return Alert.alert(
        "Guardado sin conexión",
        "Tu recorrido se guardó en el teléfono y se subirá automáticamente al recuperar internet.",
        [{ text: "OK", onPress: () => router.replace("/mis-actividades") }]
      );
    }
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
  if (!endpoints) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.mute}>Esta ruta no tiene inicio y fin definidos.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavMapWebView
        routeTrack={route.track ?? []}
        waypoints={route.waypoints ?? []}
        userTrack={phase === "recording" ? userTrack : []}
        position={position}
        startPoint={endpoints.start}
        endPoint={endpoints.end}
        guideTo={phase === "approach" ? endpoints.start : null}
      />

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {phase === "approach" ? (
          <>
            <View style={styles.statsRow}>
              <Stat
                label="Distancia al inicio"
                value={
                  distanceToStart == null
                    ? "—"
                    : distanceToStart < 1
                    ? `${Math.round(distanceToStart * 1000)} m`
                    : `${distanceToStart.toFixed(2)} km`
                }
              />
            </View>
            {arrived ? (
              <>
                <Text style={[styles.banner, { color: colors.go400 }]}>
                  ✓ Llegaste al inicio de la ruta
                </Text>
                <Pressable style={styles.btnStop} onPress={empezar}>
                  <Text style={styles.btnStopText}>Empezar grabación</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.live}>
                {approachPos
                  ? "Dirígete al punto de inicio (▶). La grabación empieza al llegar."
                  : "Buscando tu ubicación…"}
              </Text>
            )}
            <Pressable style={styles.btnDiscard} onPress={() => router.back()}>
              <Text style={styles.btnDiscardText}>Cancelar</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.statsRow}>
              <Stat label="Distancia" value={`${distance.toFixed(2)} km`} />
              <Stat label="Tiempo" value={formatTime(elapsed)} />
              <Stat label="Puntos" value={String(userTrack.length)} />
            </View>
            <Text
              style={[
                styles.live,
                nearEnd
                  ? { color: colors.trail400 }
                  : recording && { color: colors.trail400 },
              ]}
            >
              {nearEnd
                ? "🏁 Llegaste al final — toca Terminar para guardar"
                : recording
                ? "● Grabando tu recorrido…"
                : "Grabación detenida"}
            </Text>
            <Pressable
              style={[
                styles.btnStop,
                saving && { opacity: 0.6 },
                nearEnd && styles.btnStopHighlight,
              ]}
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
          </>
        )}
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
  banner: { fontSize: 15, textAlign: "center", fontWeight: "800" },
  btnStop: { backgroundColor: colors.trail500, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnStopHighlight: { shadowColor: colors.trail500, shadowOpacity: 0.6, shadowRadius: 12, elevation: 6 },
  btnStopText: { color: colors.ink950, fontSize: 16, fontWeight: "700" },
  btnDiscard: { borderWidth: 1, borderColor: colors.ink600, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnDiscardText: { color: colors.bone, fontSize: 16, fontWeight: "600" },
});
