import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth, BYPASS_AUTH } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { MapWebView } from "@/components/MapWebView";
import { StarRating } from "@/components/StarRating";
import { fetchReviews, saveReview, deleteReview, reviewStats, type RouteReview } from "@/lib/reviews";
import type { Point } from "@/lib/geo";
import type { Waypoint } from "@/lib/activities";
import { saveRouteOffline, removeOfflineRoute, isRouteOffline } from "@/lib/offline";
import { cacheTilesForTrack } from "@/lib/tileCache";

type RouteRow = {
  id: string;
  name: string;
  description: string | null;
  state: string;
  region: string | null;
  level: string;
  distance_km: number | null;
  track: Point[] | null;
  waypoints: Waypoint[] | null;
  calificada: boolean;
};

export default function RutaDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [route, setRoute] = useState<RouteRow | null>(null);
  const [reviews, setReviews] = useState<RouteReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [dlPct, setDlPct] = useState<number | null>(null); // null = no descargando

  const myReview = session ? reviews.find((r) => r.user_id === session.user.id) ?? null : null;

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviews(await fetchReviews(id));
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from("user_routes")
        .select("id, name, description, state, region, level, distance_km, track, waypoints, calificada")
        .eq("id", id)
        .single<RouteRow>();
      setRoute(data ?? null);
      setDownloaded(await isRouteOffline(id));
      await loadReviews();
      setLoading(false);
    })();
  }, [id, loadReviews]);

  async function toggleDescarga() {
    if (!route || !id) return;
    if (downloaded) {
      await removeOfflineRoute(id);
      setDownloaded(false);
      return;
    }
    setDlPct(0);
    await saveRouteOffline({
      id: route.id,
      name: route.name,
      track: route.track,
      waypoints: route.waypoints,
      description: route.description,
      state: route.state,
      region: route.region,
      level: route.level,
      distance_km: route.distance_km,
    });
    // Cachea los tiles del mapa del área de la ruta para verla con fondo offline.
    if (route.track && route.track.length > 1) {
      await cacheTilesForTrack(route.track, (done, total) =>
        setDlPct(total ? Math.round((done / total) * 100) : 100)
      );
    }
    setDlPct(null);
    setDownloaded(true);
    Alert.alert(
      "Descargada",
      "Ruta y mapa guardados. Ya puedes hacerla sin internet desde Perfil → Rutas descargadas."
    );
  }

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body ?? "");
    }
  }, [myReview?.id]);

  const { average, count } = reviewStats(reviews);

  async function onSave() {
    if (!session || !id) return;
    if (rating < 1) return Alert.alert("Califica", "Elige de 1 a 5 estrellas.");
    setSaving(true);
    const authorName =
      (session.user.user_metadata?.full_name as string | undefined) ??
      session.user.email?.split("@")[0] ??
      "Miembro";
    const err = await saveReview({
      userRouteId: id,
      userId: session.user.id,
      authorName,
      rating,
      body: body.trim() || null,
      existingId: myReview?.id ?? null,
    });
    setSaving(false);
    if (err) return Alert.alert("Error", err);
    await loadReviews();
  }

  async function onDelete(reviewId: string) {
    await deleteReview(reviewId);
    if (myReview?.id === reviewId) {
      setRating(0);
      setBody("");
    }
    await loadReviews();
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <MapWebView track={route.track ?? []} waypoints={route.waypoints ?? []} />

      <View>
        <Text style={styles.title}>{route.name}</Text>
        <Text style={styles.meta}>
          {route.region ? `${route.region} · ` : ""}{route.state} · {route.level} ·{" "}
          {route.distance_km != null ? `${route.distance_km} km` : "—"}
        </Text>
        {route.calificada && <Text style={styles.badge}>★ Ruta calificada</Text>}
      </View>

      {(route.track?.length ?? 0) > 1 && (
        <>
          <Pressable
            style={styles.hacerBtn}
            onPress={() => router.push(session || BYPASS_AUTH ? `/hacer-ruta/${id}` : "/login")}
          >
            <Text style={styles.hacerBtnText}>▶ Hacer ruta</Text>
          </Pressable>
          <Pressable
            style={styles.descargaBtn}
            onPress={toggleDescarga}
            disabled={dlPct !== null}
          >
            <Text style={styles.descargaBtnText}>
              {dlPct !== null
                ? `Descargando mapa… ${dlPct}%`
                : downloaded
                ? "✓ Descargada — quitar"
                : "⤓ Descargar para usar sin internet"}
            </Text>
          </Pressable>
        </>
      )}

      {route.description ? <Text style={styles.desc}>{route.description}</Text> : null}

      {/* Reseñas */}
      <View style={styles.divider} />
      <View style={styles.reviewHead}>
        <Text style={styles.section}>Reseñas</Text>
        {count > 0 && (
          <Text style={styles.avg}>
            ★ {average.toFixed(1)} · {count}
          </Text>
        )}
      </View>

      {session ? (
        <View style={styles.card}>
          <Text style={styles.label}>{myReview ? "Tu reseña" : "Califica esta ruta"}</Text>
          <StarRating value={rating} onChange={setRating} size={30} />
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Comparte cómo te fue (opcional)…"
            placeholderTextColor={colors.mute}
            multiline
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable style={[styles.btn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
              <Text style={styles.btnText}>{myReview ? "Actualizar" : "Publicar"}</Text>
            </Pressable>
            {myReview && (
              <Pressable onPress={() => onDelete(myReview.id)}>
                <Text style={styles.del}>Borrar la mía</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.mute}>Inicia sesión para reseñar.</Text>
      )}

      {reviews.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.reviewHead}>
            <Text style={styles.author}>{r.author_name}</Text>
            <StarRating value={r.rating} size={14} />
          </View>
          {r.body ? <Text style={styles.reviewBody}>{r.body}</Text> : null}
        </View>
      ))}
      {count === 0 && <Text style={styles.mute}>Aún no hay reseñas.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  title: { color: colors.bone, fontSize: 26, fontWeight: "800" },
  meta: { color: colors.mute, fontSize: 13, marginTop: 6 },
  badge: { color: colors.trail300, fontSize: 13, fontWeight: "800", marginTop: 8 },
  hacerBtn: { backgroundColor: colors.trail500, paddingVertical: 15, borderRadius: 999, alignItems: "center" },
  hacerBtnText: { color: colors.ink950, fontSize: 16, fontWeight: "700" },
  descargaBtn: { borderWidth: 1, borderColor: colors.ink600, paddingVertical: 13, borderRadius: 999, alignItems: "center" },
  descargaBtnText: { color: colors.bone, fontSize: 14, fontWeight: "600" },
  desc: { color: colors.mute, fontSize: 15, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.ink700 },
  section: { color: colors.bone, fontSize: 20, fontWeight: "800" },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avg: { color: colors.trail400, fontWeight: "700" },
  card: { borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 14, padding: 16, gap: 10 },
  label: { color: colors.bone, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: colors.ink600, backgroundColor: colors.ink950, borderRadius: 12, padding: 12, color: colors.bone, minHeight: 60, textAlignVertical: "top" },
  btn: { backgroundColor: colors.trail500, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999 },
  btnText: { color: colors.ink950, fontWeight: "700" },
  del: { color: colors.red, fontWeight: "600" },
  author: { color: colors.trail400, fontWeight: "700" },
  reviewBody: { color: colors.mute, fontSize: 14, lineHeight: 20 },
  mute: { color: colors.mute },
});
