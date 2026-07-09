import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Port móvil del feed de comunidad de la web (app/comunidad). Usa las mismas
// tablas del foro: forum_threads/forum_replies + tablas de likes.

export const MAX_BODY = 500;

export interface Post {
  id: string;
  body: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  image_urls: string[];
  reply_count: number;
  like_count: number;
  user_liked: boolean;
}

export interface PostReply {
  id: string;
  body: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  image_urls: string[];
  like_count: number;
  user_liked: boolean;
}

type CountRel = { count: number }[];

/** Nombre y avatar del autor a partir de la sesión (espejo de actions.ts web). */
export function authorInfo(session: Session): { name: string; avatar: string | null } {
  const meta = session.user.user_metadata ?? {};
  const name =
    (meta.full_name as string | undefined) ??
    session.user.email?.split("@")[0] ??
    "Miembro";
  const avatar = (meta.avatar_url as string | undefined) ?? null;
  return { name, avatar };
}

export async function fetchPosts(limit: number, userId: string | null): Promise<Post[]> {
  const { data: rawPosts } = await supabase
    .from("forum_threads")
    .select(
      "id, body, author_name, author_avatar, created_at, image_urls, replies:forum_replies(count), likes:forum_thread_likes(count)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  type Raw = Omit<Post, "reply_count" | "like_count" | "user_liked"> & {
    replies?: CountRel;
    likes?: CountRel;
  };
  const posts = (rawPosts as Raw[] | null) ?? [];

  let likedIds = new Set<string>();
  if (userId && posts.length > 0) {
    const { data: likedRows } = await supabase
      .from("forum_thread_likes")
      .select("thread_id")
      .eq("user_id", userId)
      .in("thread_id", posts.map((p) => p.id));
    likedIds = new Set(((likedRows as { thread_id: string }[]) ?? []).map((r) => r.thread_id));
  }

  return posts.map((p) => ({
    id: p.id,
    body: p.body ?? "",
    author_name: p.author_name,
    author_avatar: p.author_avatar ?? null,
    created_at: p.created_at,
    image_urls: p.image_urls ?? [],
    reply_count: p.replies?.[0]?.count ?? 0,
    like_count: p.likes?.[0]?.count ?? 0,
    user_liked: likedIds.has(p.id),
  }));
}

export async function fetchPost(
  id: string,
  userId: string | null
): Promise<{ post: Post | null; replies: PostReply[] }> {
  const [{ data: rawPost }, { data: rawReplies }] = await Promise.all([
    supabase
      .from("forum_threads")
      .select(
        "id, body, author_name, author_avatar, created_at, image_urls, replies:forum_replies(count), likes:forum_thread_likes(count)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("forum_replies")
      .select("id, body, author_name, author_avatar, created_at, image_urls, likes:forum_reply_likes(count)")
      .eq("thread_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!rawPost) return { post: null, replies: [] };

  type RawReply = Omit<PostReply, "like_count" | "user_liked"> & { likes?: CountRel };
  const repliesRaw = (rawReplies as RawReply[] | null) ?? [];

  let postLiked = false;
  let likedReplyIds = new Set<string>();
  if (userId) {
    const [tl, rl] = await Promise.all([
      supabase
        .from("forum_thread_likes")
        .select("thread_id")
        .eq("user_id", userId)
        .eq("thread_id", id)
        .maybeSingle(),
      repliesRaw.length > 0
        ? supabase
            .from("forum_reply_likes")
            .select("reply_id")
            .eq("user_id", userId)
            .in("reply_id", repliesRaw.map((r) => r.id))
        : Promise.resolve({ data: [] as { reply_id: string }[] }),
    ]);
    postLiked = !!tl.data;
    likedReplyIds = new Set(((rl.data as { reply_id: string }[]) ?? []).map((r) => r.reply_id));
  }

  const p = rawPost as RawReply & { replies?: CountRel };
  const post: Post = {
    id: p.id,
    body: p.body ?? "",
    author_name: p.author_name,
    author_avatar: p.author_avatar ?? null,
    created_at: p.created_at,
    image_urls: p.image_urls ?? [],
    reply_count: p.replies?.[0]?.count ?? 0,
    like_count: p.likes?.[0]?.count ?? 0,
    user_liked: postLiked,
  };

  const replies: PostReply[] = repliesRaw.map((r) => ({
    id: r.id,
    body: r.body ?? "",
    author_name: r.author_name,
    author_avatar: r.author_avatar ?? null,
    created_at: r.created_at,
    image_urls: r.image_urls ?? [],
    like_count: r.likes?.[0]?.count ?? 0,
    user_liked: likedReplyIds.has(r.id),
  }));

  return { post, replies };
}

export async function createPost(params: {
  userId: string;
  authorName: string;
  avatar: string | null;
  body: string;
}): Promise<string | null> {
  const body = params.body.trim();
  if (!body) return "Escribe algo para publicar.";
  if (body.length > MAX_BODY) return `Máximo ${MAX_BODY} caracteres.`;

  const { error } = await supabase.from("forum_threads").insert({
    user_id: params.userId,
    body,
    author_name: params.authorName,
    author_avatar: params.avatar,
    image_urls: [],
  });
  return error ? "No se pudo publicar. Intenta de nuevo." : null;
}

export async function createReply(params: {
  postId: string;
  userId: string;
  authorName: string;
  avatar: string | null;
  body: string;
}): Promise<string | null> {
  const body = params.body.trim();
  if (!body) return "Escribe algo para responder.";
  if (body.length > MAX_BODY) return `Máximo ${MAX_BODY} caracteres.`;

  const { error } = await supabase.from("forum_replies").insert({
    thread_id: params.postId,
    user_id: params.userId,
    body,
    author_name: params.authorName,
    author_avatar: params.avatar,
    image_urls: [],
  });
  return error ? "Error al enviar la respuesta." : null;
}

export async function togglePostLike(postId: string, userId: string) {
  const { data } = await supabase
    .from("forum_thread_likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("thread_id", postId)
    .maybeSingle();
  if (data) {
    await supabase.from("forum_thread_likes").delete().eq("user_id", userId).eq("thread_id", postId);
  } else {
    await supabase.from("forum_thread_likes").insert({ user_id: userId, thread_id: postId });
  }
}

export async function toggleReplyLike(replyId: string, userId: string) {
  const { data } = await supabase
    .from("forum_reply_likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("reply_id", replyId)
    .maybeSingle();
  if (data) {
    await supabase.from("forum_reply_likes").delete().eq("user_id", userId).eq("reply_id", replyId);
  } else {
    await supabase.from("forum_reply_likes").insert({ user_id: userId, reply_id: replyId });
  }
}
