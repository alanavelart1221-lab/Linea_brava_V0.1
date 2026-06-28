import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { NavMapWebView } from "@/components/NavMapWebView";
import { trackDistanceKm, validarTrack, type Point } from "@/lib/geo";
import {
  guardarActividad,
  crearRutaDesdeActividad,
  WAYPOINT_CATEGORIES,
  type Waypoint,
  type WaypointCategory,
  type Nivel,
} from "@/lib/activities";
import {
  startTracking,
  stopTracking,
  subscribe,
  getTrack,
  getWaypoints,
  getStartedAt,
  getActiveRecording,
  resumeTracking,
  addWaypoint,
} from "@/lib/tracking";

type Phase = "idle" | "recording" | "review";
type ReviewMode = "choice" | "ruta";
const NIVELES: Nivel[] = ["Verde", "Azul", "Negro", "Pro"];

export default function Grabar() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>("idle");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("choice");
  const [track, setTrack] = useState<Point[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Modal de waypoint
  const [wpOpen, setWpOpen] = useState(false);
  const [wpName, setWpName] = useState("");
  const [wpCat, setWpCat] = useState<WaypointCategory>("vista");
  const wpCoord = useRef<Point | null>(null);

  // Form de actividad / ruta
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [state, setState] = useState("");
  const [level, setLevel] = useState<Nivel>("Verde");
  const [description, setDescription] = useState("");

  const recUnsub = useRef<() => void>(() => {});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeChecked = useRef(false);

  const distance = trackDistanceKm(track);
  const position: Point | null = track.length ? track[track.length - 1] : null;

  useEffect(() => {
    return () => {
      // Al salir solo soltamos los listeners y el cronómetro de la UI; la
      // grabación sigue en segundo plano y se reanuda al volver.
      recUnsub.current();
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  // Reanudar una grabación libre en curso (p. ej. tras cerrar y reabrir la app).
  useEffect(() => {
    if (resumeChecked.current) return;
    resumeChecked.current = true;
    (async () => {
      const active = await getActiveRecording();
      if (active?.context.kind !== "free") return;
      await resumeTracking();
      attachRecordingUI();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Engancha la UI al estado de tracking.ts (track en vivo, waypoints, tiempo).
  function attachRecordingUI() {
    recUnsub.current(); // suelta una suscripción previa si la hubiera
    if (timer.current) clearInterval(timer.current);
    const tick = () => setElapsed(Math.floor((Date.now() - getStartedAt()) / 1000));
    tick();
    timer.current = setInterval(tick, 1000);
    recUnsub.current = subscribe((t) => setTrack([...t]));
    setTrack([...getTrack()]);
    setWaypoints([...getWaypoints()]);
    setPhase("recording");
  }

  async function startRecording() {
    setTrack([]);
    setWaypoints([]);
    setElapsed(0);
    const err = await startTracking({ kind: "free" });
    if (err) {
      Alert.alert("Permiso necesario", err);
      return;
    }
    attachRecordingUI();
  }

  async function stopRecording() {
    recUnsub.current();
    recUnsub.current = () => {};
    if (timer.current) clearInterval(timer.current);
    await stopTracking();
    setReviewMode("choice");
    setPhase("review");
  }

  async function openWaypoint() {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    wpCoord.current = [pos.coords.latitude, pos.coords.longitude];
    setWpName("");
    setWpCat("vista");
    setWpOpen(true);
  }

  function saveWaypoint() {
    if (!wpCoord.current) return;
    const wp: Waypoint = {
      lat: wpCoord.current[0],
      lng: wpCoord.current[1],
      name: wpName.trim() || WAYPOINT_CATEGORIES.find((c) => c.key === wpCat)!.label,
      category: wpCat,
    };
    addWaypoint(wp); // persiste en disco para sobrevivir a segundo plano
    setWaypoints((prev) => [...prev, wp]);
    setWpOpen(false);
  }

  function startedAtIso() {
    return new Date(getStartedAt() || Date.now()).toISOString();
  }

  async function onGuardarActividad() {
    if (!session) return;
    if (track.length < 2) {
      Alert.alert("Actividad vacía", "No hay suficiente recorrido para guardar.");
      return;
    }
    setSubmitting(true);
    const { error } = await guardarActividad({
      userId: session.user.id,
      title: title || null,
      track,
      waypoints,
      durationS: elapsed,
      startedAt: startedAtIso(),
    });
    setSubmitting(false);
    if (error) return Alert.alert("Error", error);
    Alert.alert("Guardada", "Tu actividad quedó en tu historial.", [
      { text: "OK", onPress: () => router.replace("/mis-actividades") },
    ]);
  }

  async function onCrearRuta() {
    if (!session) return;
    if (!name.trim() || !state.trim()) {
      Alert.alert("Faltan datos", "Pon al menos el nombre y el estado de la ruta.");
      return;
    }
    const validationError = validarTrack(track);
    if (validationError) return Alert.alert("Ruta no válida", validationError);

    setSubmitting(true);
    // 1) Guarda la actividad (registro privado).
    const act = await guardarActividad({
      userId: session.user.id,
      title: title || name,
      track,
      waypoints,
      durationS: elapsed,
      startedAt: startedAtIso(),
    });
    if (act.error || !act.id) {
      setSubmitting(false);
      return Alert.alert("Error", act.error ?? "No se pudo guardar.");
    }
    // 2) Publica la ruta y la liga a la actividad.
    const { error } = await crearRutaDesdeActividad({
      userId: session.user.id,
      activityId: act.id,
      name,
      state,
      region: region || null,
      level,
      description: description || null,
      track,
      waypoints,
    });
    setSubmitting(false);
    if (error) return Alert.alert("Error", error);
    Alert.alert("¡Ruta publicada!", "Tu ruta ya está en la comunidad.", [
      { text: "OK", onPress: () => router.replace("/mis-rutas") },
    ]);
  }

  function descartar() {
    Alert.alert("¿Descartar actividad?", "Esto no se guardará.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: () => {
          setTrack([]);
          setWaypoints([]);
          setElapsed(0);
          setTitle("");
          setReviewMode("choice");
          setPhase("idle");
        },
      },
    ]);
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ---- Pantalla de revisión ----
  if (phase === "review") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={styles.statsRow}>
          <Stat label="Distancia" value={`${distance.toFixed(2)} km`} />
          <Stat label="Tiempo" value={formatTime(elapsed)} />
          <Stat label="Puntos" value={String(track.length)} />
          <Stat label="Waypoints" value={String(waypoints.length)} />
        </View>

        {reviewMode === "choice" ? (
          <>
            <Field label="Título de la actividad (opcional)">
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={`Actividad del ${new Date().toLocaleDateString("es-MX")}`}
                placeholderTextColor={colors.mute}
              />
            </Field>
            <Pressable
              style={[styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={onGuardarActividad}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.ink950} />
              ) : (
                <Text style={styles.btnPrimaryText}>Guardar actividad</Text>
              )}
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={() => setReviewMode("ruta")} disabled={submitting}>
              <Text style={styles.btnGhostText}>Crear ruta de esta actividad</Text>
            </Pressable>
            <Pressable style={styles.btnText} onPress={descartar} disabled={submitting}>
              <Text style={styles.btnTextLabel}>Descartar actividad</Text>
            </Pressable>
            <Text style={styles.hintSmall}>
              Tu actividad es privada. Crear ruta la publica en la comunidad (la actividad se
              conserva en tu historial).
            </Text>
          </>
        ) : (
          <>
            <Field label="Nombre de la ruta *">
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. Brecha del Cerro Prieto" placeholderTextColor={colors.mute} />
            </Field>
            <Field label="Estado *">
              <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="Ej. Nuevo León" placeholderTextColor={colors.mute} />
            </Field>
            <Field label="Región / Sierra">
              <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder="Ej. Sierra San Pedro Mártir" placeholderTextColor={colors.mute} />
            </Field>
            <Field label="Nivel">
              <View style={styles.levelRow}>
                {NIVELES.map((l) => (
                  <Pressable key={l} style={[styles.levelChip, level === l && styles.levelChipActive]} onPress={() => setLevel(l)}>
                    <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label="Descripción">
              <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Acceso, terreno, puntos de interés…" placeholderTextColor={colors.mute} multiline />
            </Field>
            <Pressable style={[styles.btnPrimary, submitting && styles.btnDisabled]} onPress={onCrearRuta} disabled={submitting}>
              {submitting ? <ActivityIndicator color={colors.ink950} /> : <Text style={styles.btnPrimaryText}>Publicar ruta</Text>}
            </Pressable>
            <Pressable style={styles.btnText} onPress={() => setReviewMode("choice")} disabled={submitting}>
              <Text style={styles.btnTextLabel}>← Volver</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    );
  }

  // ---- Pantalla inicial (sin grabar todavía) ----
  if (phase === "idle") {
    return (
      <View style={[styles.container, { padding: 24, justifyContent: "center" }]}>
        <View style={styles.statsRow}>
          <Stat label="Distancia" value={`${distance.toFixed(2)} km`} />
          <Stat label="Tiempo" value={formatTime(elapsed)} />
          <Stat label="Puntos" value={String(track.length)} />
          <Stat label="Waypoints" value={String(waypoints.length)} />
        </View>
        <Text style={styles.hint}>
          Sal al terreno, presiona iniciar y el GPS grabará tu ruta automáticamente.
        </Text>
        <Pressable style={styles.btnPrimary} onPress={startRecording}>
          <Text style={styles.btnPrimaryText}>● Iniciar grabación</Text>
        </Pressable>
      </View>
    );
  }

  // ---- Pantalla de grabación (con mapa en vivo) ----
  return (
    <View style={styles.container}>
      <NavMapWebView
        routeTrack={[]}
        waypoints={waypoints}
        userTrack={track}
        position={position}
        userColor={colors.trail500}
        markerColor={colors.go500}
      />

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.statsRow, { marginBottom: 0 }]}>
          <Stat label="Distancia" value={`${distance.toFixed(2)} km`} />
          <Stat label="Tiempo" value={formatTime(elapsed)} />
          <Stat label="Puntos" value={String(track.length)} />
          <Stat label="Waypoints" value={String(waypoints.length)} />
        </View>
        <Text style={[styles.live, { color: colors.trail400 }]}>
          ● Grabando… sigue activo aunque cierres la app o apagues la pantalla.
        </Text>
        <Pressable style={styles.btnWaypoint} onPress={openWaypoint}>
          <Text style={styles.btnWaypointText}>+ Marcar punto (waypoint)</Text>
        </Pressable>
        <Pressable style={styles.btnStop} onPress={stopRecording}>
          <Text style={styles.btnGhostText}>Terminar</Text>
        </Pressable>
      </View>

      {/* Modal de waypoint */}
      <Modal visible={wpOpen} transparent animationType="slide" onRequestClose={() => setWpOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo waypoint</Text>
            <TextInput
              style={styles.input}
              value={wpName}
              onChangeText={setWpName}
              placeholder="Nombre (opcional)"
              placeholderTextColor={colors.mute}
            />
            <View style={styles.catWrap}>
              {WAYPOINT_CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  style={[styles.catChip, wpCat === c.key && styles.catChipActive]}
                  onPress={() => setWpCat(c.key)}
                >
                  <Text style={styles.catEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catLabel, wpCat === c.key && styles.catLabelActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.btnPrimary} onPress={saveWaypoint}>
              <Text style={styles.btnPrimaryText}>Agregar</Text>
            </Pressable>
            <Pressable style={styles.btnText} onPress={() => setWpOpen(false)}>
              <Text style={styles.btnTextLabel}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  panel: {
    backgroundColor: colors.ink900,
    borderTopWidth: 1,
    borderTopColor: colors.ink700,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  live: { fontSize: 13, textAlign: "center", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  stat: { flex: 1, borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  statLabel: { color: colors.mute, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { color: colors.bone, fontSize: 18, fontWeight: "800", marginTop: 4 },
  hint: { color: colors.mute, fontSize: 15, textAlign: "center", marginBottom: 20, lineHeight: 22 },
  hintSmall: { color: colors.mute, fontSize: 13, lineHeight: 19, textAlign: "center" },
  btnPrimary: { backgroundColor: colors.trail500, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnPrimaryText: { color: colors.ink950, fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  btnGhost: { borderWidth: 1, borderColor: colors.ink600, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnGhostText: { color: colors.bone, fontSize: 16, fontWeight: "600" },
  btnStop: { borderWidth: 1, borderColor: colors.ink600, backgroundColor: colors.ink800, paddingVertical: 16, borderRadius: 999, alignItems: "center", marginTop: 12 },
  btnWaypoint: { borderWidth: 1, borderColor: colors.trail500, backgroundColor: "rgba(245,158,11,0.12)", paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  btnWaypointText: { color: colors.trail400, fontSize: 15, fontWeight: "700" },
  btnText: { paddingVertical: 12, alignItems: "center" },
  btnTextLabel: { color: colors.mute, fontSize: 15 },
  fieldLabel: { color: colors.bone, fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: colors.ink600, backgroundColor: colors.ink900, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.bone, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: "top" },
  levelRow: { flexDirection: "row", gap: 8 },
  levelChip: { flex: 1, borderWidth: 1, borderColor: colors.ink600, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  levelChipActive: { borderColor: colors.trail500, backgroundColor: "rgba(245,158,11,0.15)" },
  levelText: { color: colors.mute, fontWeight: "600" },
  levelTextActive: { color: colors.trail400 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.ink900, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 14 },
  modalTitle: { color: colors.bone, fontSize: 20, fontWeight: "800" },
  catWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.ink600, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  catChipActive: { borderColor: colors.trail500, backgroundColor: "rgba(245,158,11,0.15)" },
  catEmoji: { fontSize: 16 },
  catLabel: { color: colors.mute, fontWeight: "600" },
  catLabelActive: { color: colors.trail400 },
});
