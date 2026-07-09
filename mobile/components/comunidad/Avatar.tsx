import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

type Props = {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
};

export function Avatar({ name, avatarUrl, size = "md" }: Props) {
  const dim = size === "sm" ? 32 : 40;

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.image, { width: dim, height: dim }]} />;
  }

  return (
    <View style={[styles.fallback, { width: dim, height: dim }]}>
      <Text style={[styles.initial, size === "sm" && { fontSize: 12 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 999,
    backgroundColor: colors.ink800,
  },
  fallback: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink600,
    backgroundColor: colors.ink800,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: colors.trail400,
    fontSize: 14,
    fontWeight: "700",
  },
});
