"use client";

import { useState } from "react";
import { createReply } from "../actions";
import { uploadMedia } from "../uploadMedia";
import { MediaPicker } from "../MediaPicker";

type Props = {
  postId: string;
  userId: string;
};

export function ReplyForm({ postId, userId }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const empty = !text.trim() && files.length === 0;

  async function handleSubmit() {
    if (empty || pending) return;
    setPending(true);
    setError(null);
    setSuccess(false);
    try {
      const imageUrls = files.length > 0 ? await uploadMedia(userId, files) : [];
      const result = await createReply(postId, { body: text.trim(), imageUrls });
      if (result?.error) {
        setError(result.error);
      } else {
        setText("");
        setFiles([]);
        setSuccess(true);
      }
    } catch {
      setError("No se pudo enviar la respuesta. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-trail-500/30 bg-trail-500/10 px-4 py-3 text-sm text-trail-400">
          Respuesta publicada.
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="Escribe tu respuesta..."
        className="w-full resize-y rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-bone placeholder:text-mute focus:border-trail-500 focus:outline-none"
      />

      <MediaPicker files={files} onChange={setFiles} />

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={pending || empty}
          className="rounded-full bg-trail-500 px-7 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-trail-400 disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Responder"}
        </button>
      </div>
    </div>
  );
}
