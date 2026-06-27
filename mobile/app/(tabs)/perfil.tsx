import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function Perfil() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const name =
    (session?.user.user_metadata?.full_name as string | undefined) ?? session?.user.email;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name?.[0] ?? "U").toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name ?? "Mi perfil"}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
        </View>
      </View>

      <Pressable style={styles.row} onPress={() => router.push("/mis-actividades")}>
        <Text style={styles.rowText}>Mis actividades</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/mis-rutas")}>
        <Text style={styles.rowText}>Mis rutas</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/descargadas")}>
        <Text style={styles.rowText}>Rutas descargadas</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>

      <Pressable style={styles.signout} onPress={signOut}>
        <Text style={styles.signoutText}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950, padding: 20, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 999, backgroundColor: colors.trail500, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.ink950, fontSize: 24, fontWeight: "900" },
  name: { color: colors.bone, fontSize: 20, fontWeight: "800" },
  email: { color: colors.mute, fontSize: 13, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.ink700, backgroundColor: colors.ink900, borderRadius: 14, padding: 16 },
  rowText: { color: colors.bone, fontSize: 16, fontWeight: "600" },
  chev: { color: colors.mute, fontSize: 22 },
  signout: { marginTop: 8, paddingVertical: 14, alignItems: "center" },
  signoutText: { color: colors.red, fontSize: 15, fontWeight: "600" },
});
