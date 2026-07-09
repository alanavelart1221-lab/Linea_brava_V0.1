import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Row = {
  id: string;
  date: string;
  title: string;
  location: string;
  level: string;
  spots: number | null;
  spots_left: number | null;
  tag: string | null;
};

// Color del chip de nivel (espejo de levelMeta de la web).
const LEVEL_COLOR: Record<string, string> = {
  Verde: colors.go400,
  Azul: "#60A5FA",
  Negro: colors.bone,
  Pro: colors.trail400,
};

export default function Eventos() {
  const [events, setEvents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("user_events")
      .select("id, date, title, location, level, spots, spots_left, tag")
      .eq("status", "approved")
      .order("date", { ascending: true });
    setEvents((data as Row[] | null) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.trail500} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={events}
      keyExtractor={(e) => e.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.trail500} />}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No hay eventos programados aún.</Text>
          <Text style={styles.emptySubtitle}>¡Sé el primero en organizar una salida!</Text>
        </View>
      }
      renderItem={({ item }) => {
        const d = new Date(item.date);
        const spots = item.spots ?? 0;
        const spotsLeft = item.spots_left ?? 0;
        const pctFilled = spots > 0 ? Math.round(((spots - spotsLeft) / spots) * 100) : 0;
        const almostFull = spotsLeft <= 6;
        const levelColor = LEVEL_COLOR[item.level] ?? colors.mute;
        return (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>{d.getDate()}</Text>
                <Text style={styles.dateMonth}>
                  {d.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase()}
                </Text>
              </View>
              <View style={styles.body}>
                {!!item.tag && <Text style={styles.eyebrow}>{item.tag}</Text>}
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.location}>{item.location}</Text>
              </View>
              <View style={[styles.levelChip, { borderColor: levelColor }]}>
                <Text style={[styles.levelChipText, { color: levelColor }]}>{item.level}</Text>
              </View>
            </View>
            {spots > 0 && (
              <View style={styles.spotsWrap}>
                <View style={styles.spotsRow}>
                  <Text style={styles.spotsLabel}>Lugares</Text>
                  <Text style={[styles.spotsCount, almostFull && { color: colors.trail400 }]}>
                    {spotsLeft} / {spots}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.max(6, pctFilled)}%`,
                        backgroundColor: almostFull ? colors.trail500 : colors.go500,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center" },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 6 },
  emptyTitle: { color: colors.bone, fontSize: 16 },
  emptySubtitle: { color: colors.mute, fontSize: 13 },
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 16,
    padding: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  dateBox: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink950,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dateDay: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 28,
    lineHeight: 30,
    color: colors.trail500,
  },
  dateMonth: {
    color: colors.mute,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  body: { flex: 1 },
  eyebrow: {
    color: colors.trail400,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  title: { color: colors.bone, fontSize: 17, fontWeight: "800", marginTop: 2 },
  location: { color: colors.mute, fontSize: 13, marginTop: 2 },
  levelChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelChipText: { fontSize: 11, fontWeight: "800" },
  spotsWrap: { marginTop: 14 },
  spotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  spotsLabel: { color: colors.mute, fontSize: 12 },
  spotsCount: { color: colors.bone, fontSize: 12, fontWeight: "700" },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.ink700,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999 },
});
