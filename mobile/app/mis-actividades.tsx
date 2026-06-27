import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { crearRutaDesdeActividad, type Waypoint, type Nivel } from "@/lib/activities";
import { trackDistanceKm, type Point } from "@/lib/geo";
import { getPendingActivities } from "@/lib/offline";

type Activity = {
  id: string;
  title: string | null;
  track: Point[];
  waypoints: Waypoint[];
  distance_km: number | null;
  created_at: string;
  route_id: string | null;
  pending?: boolean;
};

const NIVELES: Nivel[] = ["Verde", "Azul", "Negro", "Pro"];

export default function MisActividades() {
  const { session } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal "crear ruta"
  const [target, setTarget] = useState<Activity | null>(null);
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [level, setLevel] = useState<Nivel>("Verde");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    // Pendientes guardadas en el teléfono (aún sin subir): se muestran arriba.
    const pending = await getPendingActivities();
    const pendingRows: Activity[] = pending.map((p) => ({
      id: p.localId,
      title: p.title,
      track: p.track,
      waypoints: p.waypoints,
      distance_km: parseFloat(trackDistanceKm(p.track).toFixed(2)),
      created_at: p.startedAt,
      route_id: null,
      pending: true,
    }));
    const { data } = await supabase
      .from("user_activities")
      .select("id, title, track, waypoints, distance_km, created_at, route_id")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setActivities([...pendingRows, ...((data as Activity[] | null) ?? [])]);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openCrearRuta(a: Activity) {
    setTarget(a);
    setName(a.title ?? "");
    setState("");
    setRegion("");
    setLevel("Verde");
    setDescription("");
  }

  async function publicar() {
    if (!session || !target) return;
    if (!name.trim() || !state.trim()) {
      Alert.alert("Faltan datos", "Pon al menos el nombre y el estado.");
      return;
    }
    setSubmitting(true);
    const { error } = await crearRutaDesdeActividad({
      userId: session.user.id,
      activityId: target.id,
      name,
      state,
      region: region || null,
      level,
      description: description || null,
      track: target.track,
      waypoints: target.waypoints ?? [],
    });
    setSubmitting(false);
    if (error) return Alert.alert("Error", error);
    setTarget(null);
    Alert.alert("¡Ruta publicada!", "Tu actividad ahora es una ruta de la comunidad.");
    load();
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        data={activities}
        keyExtractor={(a) => a.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
        ListEmptyComponent={<Text style={styles.empty}>Aún no tienes actividades. Graba una desde el inicio.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.title ?? "Actividad sin título"}</Text>
                <Text style={styles.meta}>
                  {new Date(item.created_at).toLocaleDateString("es-MX")} ·{" "}
                  {item.distance_km != null ? `${item.distance_km} km` : "—"} ·{" "}
                  {(item.waypoints?.length ?? 0)} waypoints
                </Text>
              </View>
              {item.pending ? (
                <Text style={styles.tagPend}>Pendiente de subir</Text>
              ) : item.route_id ? (
                <Text style={styles.tagRuta}>Es ruta</Text>
              ) : (
                <Text style={styles.tagPriv}>Privada</Text>
              )}
            </View>
            {!item.route_id && !item.pending && (
              <Pressable style={styles.btnSmall} onPress={() => openCrearRuta(item)}>
                <Text style={styles.btnSmallText}>Crear ruta</Text>
              </Pressable>
            )}
          </View>
        )}
      />

      {/* Modal crear ruta */}
      <Modal visible={target !== null} transparent animationType="slide" onRequestClose={() => setTarget(null)}>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ gap: 14, padding: 24 }}>
            <Text style={styles.modalTitle}>Crear ruta</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre de la ruta *" placeholderTextColor={colors.mute} />
            <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="Estado *" placeholderTextColor={colors.mute} />
            <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder="Región / Sierra" placeholderTextColor={colors.mute} />
            <View style={styles.levelRow}>
              {NIVELES.map((l) => (
                <Pressable key={l} style={[styles.levelChip, level === l && styles.levelChipActive]} onPress={() => setLevel(l)}>
                  <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Descripción" placeholderTextColor={colors.mute} multiline />
            <Pressable style={[styles.btnPrimary, submitting && { opacity: 0.6 }]} onPress={publicar} disabled={submitting}>
              {submitting ? <ActivityIndicator color={colors.ink950} /> : <Text style={styles.btnPrimaryText}>Publicar ruta</Text>}
            </Pressable>
            <Pressable style={styles.btnText} onPress={() => setTarget(null)} disabled={submitting}>
              <Text style={styles.btnTextLabel}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  empty: { color: colors.mute, textAlign: "center", marginTop: 48, fontSize: 15, paddingHorizontal: 24 },
  card: { borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 14, padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { color: colors.bone, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.mute, fontSize: 13, marginTop: 4 },
  tagRuta: { color: colors.go400, fontSize: 12, fontWeight: "700" },
  tagPriv: { color: colors.mute, fontSize: 12, fontWeight: "700" },
  tagPend: { color: colors.trail400, fontSize: 12, fontWeight: "700" },
  btnSmall: { borderWidth: 1, borderColor: colors.trail500, backgroundColor: "rgba(245,158,11,0.12)", borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  btnSmallText: { color: colors.trail400, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.ink900, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%" },
  modalTitle: { color: colors.bone, fontSize: 20, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: colors.ink600, backgroundColor: colors.ink950, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.bone, fontSize: 15 },
  textarea: { height: 90, textAlignVertical: "top" },
  levelRow: { flexDirection: "row", gap: 8 },
  levelChip: { flex: 1, borderWidth: 1, borderColor: colors.ink600, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  levelChipActive: { borderColor: colors.trail500, backgroundColor: "rgba(245,158,11,0.15)" },
  levelText: { color: colors.mute, fontWeight: "600" },
  levelTextActive: { color: colors.trail400 },
  btnPrimary: { backgroundColor: colors.trail500, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  btnPrimaryText: { color: colors.ink950, fontSize: 16, fontWeight: "700" },
  btnText: { paddingVertical: 8, alignItems: "center" },
  btnTextLabel: { color: colors.mute, fontSize: 15 },
});
