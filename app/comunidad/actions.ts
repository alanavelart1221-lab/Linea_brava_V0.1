"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

type FormState = { error: string | null; success?: boolean } | null;

const MAX_BODY = 500;
const MAX_IMAGES = 4;

function authorInfo(user: { user_metadata?: Record<string, unknown>; email?: string }) {
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Miembro";
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  return { name, avatar };
}

export async function createPost(input: {
  body: string;
  imageUrls: string[];
}): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para publicar." };

  const body = input.body.trim();
  const imageUrls = input.imageUrls.slice(0, MAX_IMAGES);
  if (!body && imageUrls.length === 0)
    return { error: "Escribe algo o adjunta una foto." };
  if (body.length > MAX_BODY)
    return { error: `Máximo ${MAX_BODY} caracteres.` };

  const { name, avatar } = authorInfo(user);

  const { error } = await supabase.from("forum_threads").insert({
    user_id: user.id,
    body,
    author_name: name,
    author_avatar: avatar,
    image_urls: imageUrls,
  });

  if (error) return { error: "No se pudo publicar. Intenta de nuevo." };

  revalidatePath("/comunidad");
  return { error: null, success: true };
}

export async function createReply(
  postId: string,
  input: { body: string; imageUrls: string[] }
): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para responder." };

  const body = input.body.trim();
  const imageUrls = input.imageUrls.slice(0, MAX_IMAGES);
  if (!body && imageUrls.length === 0)
    return { error: "Escribe algo o adjunta una foto." };
  if (body.length > MAX_BODY)
    return { error: `Máximo ${MAX_BODY} caracteres.` };

  const { name, avatar } = authorInfo(user);

  const { error } = await supabase.from("forum_replies").insert({
    thread_id: postId,
    user_id: user.id,
    body,
    author_name: name,
    author_avatar: avatar,
    image_urls: imageUrls,
  });

  if (error) return { error: "Error al enviar la respuesta." };

  revalidatePath(`/comunidad/${postId}`);
  return { error: null, success: true };
}

export async function togglePostLike(postId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("forum_thread_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("thread_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("forum_thread_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("thread_id", postId);
  } else {
    await supabase
      .from("forum_thread_likes")
      .insert({ user_id: user.id, thread_id: postId });
  }

  revalidatePath(`/comunidad/${postId}`);
  revalidatePath("/comunidad");
}

export async function toggleReplyLike(replyId: string, postId: string): Promise<void> {
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

  revalidatePath(`/comunidad/${postId}`);
}

// --- Moderación (solo admin). La RLS de Supabase impone la seguridad real. ---

export async function deletePost(postId: string): Promise<void> {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  await supabase.from("forum_threads").delete().eq("id", postId);
  revalidatePath("/comunidad");
  redirect("/comunidad");
}

export async function deleteReply(replyId: string, postId: string): Promise<void> {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  await supabase.from("forum_replies").delete().eq("id", replyId);
  revalidatePath(`/comunidad/${postId}`);
}
