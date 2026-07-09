import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { getYouTubeThumbnail } from "@/lib/videoEmbed";

/**
 * Reproductor embebido de YouTube/Vimeo para posts de comunidad.
 * Para YouTube muestra primero la miniatura (ligera) y carga el WebView
 * solo cuando el usuario toca play; Vimeo no tiene miniatura pública,
 * así que carga el reproductor directo.
 */
export function VideoEmbed({ embedUrl }: { embedUrl: string }) {
  const thumb = getYouTubeThumbnail(embedUrl);
  const [playing, setPlaying] = useState(!thumb);

  return (
    <View style={styles.wrap}>
      {playing ? (
        <WebView
          source={{ uri: thumb ? `${embedUrl}?autoplay=1&playsinline=1` : embedUrl }}
          style={styles.fill}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      ) : (
        <Pressable style={styles.thumb} onPress={() => setPlaying(true)}>
          <Image source={{ uri: thumb! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.playBadge}>
            <Ionicons name="play" size={26} color={colors.bone} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink950,
  },
  fill: { flex: 1, backgroundColor: colors.ink950 },
  thumb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playBadge: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.65)",
    borderWidth: 1,
    borderColor: "rgba(237,233,227,0.3)",
  },
});
