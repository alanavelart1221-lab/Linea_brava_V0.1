"use client";

import { useState } from "react";
import { createPost } from "./actions";
import { uploadMedia } from "./uploadMedia";
import { MediaPicker } from "./MediaPicker";
import { Avatar } from "./Avatar";

type Props = {
  userId: string;
  userName: string;
  avatarUrl: string | null;
};

export function Composer({ userId, userName, avatarUrl }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empty = !text.trim() && files.length === 0;

  async function handleSubmit() {
    if (empty || pending) return;
    setPending(true);
    setError(null);
    try {
      const imageUrls = files.length > 0 ? await uploadMedia(userId, files) : [];
      const result = await createPost({ body: text.trim(), imageUrls });
      if (result?.error) {
        setError(result.error);
      } else {
        setText("");
        setFiles([]);
      }
    } catch {
      setError("No se pudo publicar. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card-line p-5 sm:p-6">
      <div className="flex gap-3">
        <Avatar name={userName} avatarUrl={avatarUrl} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="¿Qué estás tramando?"
          className="w-full resize-none bg-transparent pt-2 text-bone placeholder:text-mute focus:outline-none"
        />
      </div>

      <div className="pl-[3.25rem]">
        <MediaPicker files={files} onChange={setFiles} />
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-ink-700 pt-3">
        <span className="text-xs text-mute">{text.length}/500</span>
        <button
          onClick={handleSubmit}
          disabled={pending || empty}
          className="rounded-full bg-trail-500 px-7 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-trail-400 disabled:opacity-50"
        >
          {pending ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </div>
  );
}
