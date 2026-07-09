import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { authorInfo, createPost, MAX_BODY } from "@/lib/comunidad";
import { Avatar } from "./Avatar";

export type ComposerHandle = { focus: () => void };

type Props = {
  onPosted: () => void;
};

// Composer de publicaciones (solo texto por ahora; fotos requieren
// expo-image-picker, pendiente de autorizar como dependencia).
export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { onPosted },
  ref
) {
  const { session } = useAuth();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  if (!session) {
    return (
      <View style={styles.card}>
        <Text style={styles.signInTitle}>Únete a la conversación</Text>
        <Text style={styles.signInSubtitle}>Inicia sesión para publicar en la comunidad.</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push("/login")}>
          <Text style={styles.signInBtnText}>Iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  const { name, avatar } = authorInfo(session);
  const canSend = body.trim().length > 0 && body.length <= MAX_BODY && !sending;

  async function onPublish() {
    if (!session || !canSend) return;
    setSending(true);
    setError(null);
    const err = await createPost({
      userId: session.user.id,
      authorName: name,
      avatar,
      body,
    });
    setSending(false);
    if (err) {
      setError(err);
      return;
    }
    setBody("");
    onPosted();
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar name={name} avatarUrl={avatar} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="¿Qué hiciste en la brecha?"
          placeholderTextColor={colors.mute}
          multiline
          maxLength={MAX_BODY}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.footer}>
        <Text style={styles.counter}>
          {body.length}/{MAX_BODY}
        </Text>
        <Pressable
          style={[styles.publishBtn, !canSend && styles.publishBtnDisabled]}
          onPress={onPublish}
          disabled={!canSend}
        >
          <Text style={styles.publishText}>{sending ? "Publicando…" : "Publicar"}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    color: colors.bone,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  error: {
    marginTop: 8,
    color: colors.red,
    fontSize: 12,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counter: {
    color: colors.mute,
    fontSize: 12,
  },
  publishBtn: {
    backgroundColor: colors.trail500,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishText: {
    color: colors.ink950,
    fontSize: 14,
    fontWeight: "800",
  },
  signInTitle: {
    color: colors.bone,
    fontSize: 16,
    fontWeight: "800",
  },
  signInSubtitle: {
    marginTop: 4,
    color: colors.mute,
    fontSize: 13,
  },
  signInBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.trail500,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  signInBtnText: {
    color: colors.ink950,
    fontSize: 14,
    fontWeight: "800",
  },
});
