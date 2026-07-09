import { Image, StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";

type Props = {
  imageUrls: string[];
};

// Espejo móvil del MediaGrid web: 1 imagen a lo ancho, 2+ en grilla de 2 columnas.
export function MediaGrid({ imageUrls }: Props) {
  if (imageUrls.length === 0) return null;

  if (imageUrls.length === 1) {
    return <Image source={{ uri: imageUrls[0] }} style={styles.single} resizeMode="cover" />;
  }

  return (
    <View style={styles.grid}>
      {imageUrls.map((url) => (
        <Image key={url} source={{ uri: url }} style={styles.cell} resizeMode="cover" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  single: {
    marginTop: 12,
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 12,
    backgroundColor: colors.ink800,
  },
  grid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    width: "48.5%",
    flexGrow: 1,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: colors.ink800,
  },
});
