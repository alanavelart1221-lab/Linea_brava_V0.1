"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Rutas", "Mecánica", "Overland & Equipo", "General"];

type FormState = { error: string | null; success?: boolean } | null;

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) return null; // 5 MB max
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("forum-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error || !data) return null;
  const { data: { publicUrl } } = supabase.storage
    .from("forum-images")
    .getPublicUrl(data.path);
  return publicUrl;
}

export async function createThread(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para publicar." };

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const category = formData.get("category") as string;

  if (!title || !body) return { error: "Completa todos los campos." };
  if (!CATEGORIES.includes(category)) return { error: "Selecciona una categoría válida." };

  const authorName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "Miembro";

  const imageFile = formData.get("image") as File | null;
  const imageUrl = imageFile ? await uploadImage(supabase, user.id, imageFile) : null;

  const { data, error } = await supabase
    .from("forum_threads")
    .insert({ user_id: user.id, title, body, category, author_name: authorName, image_url: imageUrl })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo publicar. Intenta de nuevo." };

  redirect(`/foro/${data.id}`);
}

export async function createReply(
  threadId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para responder." };

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "La respuesta no puede estar vacía." };

  const authorName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "Miembro";

  const imageFile = formData.get("image") as File | null;
  const imageUrl = imageFile ? await uploadImage(supabase, user.id, imageFile) : null;

  const { error } = await supabase
    .from("forum_replies")
    .insert({ thread_id: threadId, user_id: user.id, body, author_name: authorName, image_url: imageUrl });

  if (error) return { error: "Error al enviar la respuesta." };

  revalidatePath(`/foro/${threadId}`);
  return { error: null, success: true };
}

export async function toggleThreadLike(threadId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("forum_thread_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("thread_id", threadId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("forum_thread_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("thread_id", threadId);
  } else {
    await supabase
      .from("forum_thread_likes")
      .insert({ user_id: user.id, thread_id: threadId });
  }

  revalidatePath(`/foro/${threadId}`);
  revalidatePath("/foro");
}

export async function toggleReplyLike(replyId: string, threadId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("forum_reply_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("reply_id", replyId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("forum_reply_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("reply_id", replyId);
  } else {
    await supabase
      .from("forum_reply_likes")
      .insert({ user_id: user.id, reply_id: replyId });
  }

  revalidatePath(`/foro/${threadId}`);
}
