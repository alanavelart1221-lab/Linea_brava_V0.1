import { supabase } from "./supabase";

export const FORUM_CATEGORIES = ["Rutas", "Mecánica", "Overland & Equipo", "General"];

export interface Thread {
  id: string;
  title: string;
  body: string;
  category: string;
  author_name: string;
  created_at: string;
  like_count: number;
}

export interface Reply {
  id: string;
  body: string;
  author_name: string;
  created_at: string;
  like_count: number;
  user_liked: boolean;
}

type WithLikes = { likes?: { count: number }[] };

export async function fetchThreads(): Promise<Thread[]> {
  const { data } = await supabase
    .from("forum_threads")
    .select("*, likes:forum_thread_likes(count)")
    .order("created_at", { ascending: false });
  return ((data as (Thread & WithLikes)[] | null) ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    body: t.body,
    category: t.category,
    author_name: t.author_name,
    created_at: t.created_at,
    like_count: t.likes?.[0]?.count ?? 0,
  }));
}

export async function fetchThread(id: string, userId: string | null) {
  const [{ data: thread }, { data: rawReplies }] = await Promise.all([
    supabase.from("forum_threads").select("*, likes:forum_thread_likes(count)").eq("id", id).single(),
    supabase
      .from("forum_replies")
      .select("*, likes:forum_reply_likes(count)")
      .eq("thread_id", id)
      .order("created_at", { ascending: true }),
  ]);

  let likedReplyIds = new Set<string>();
  let threadLiked = false;
  if (userId) {
    const [tl, rl] = await Promise.all([
      supabase.from("forum_thread_likes").select("thread_id").eq("user_id", userId).eq("thread_id", id).maybeSingle(),
      (rawReplies ?? []).length > 0
        ? supabase
            .from("forum_reply_likes")
            .select("reply_id")
            .eq("user_id", userId)
            .in("reply_id", (rawReplies ?? []).map((r: { id: string }) => r.id))
        : Promise.resolve({ data: [] as { reply_id: string }[] }),
    ]);
    threadLiked = !!tl.data;
    likedReplyIds = new Set(((rl.data as { reply_id: string }[]) ?? []).map((r) => r.reply_id));
  }

  const replies: Reply[] = ((rawReplies as (Reply & WithLikes & { id: string })[] | null) ?? []).map((r) => ({
    id: r.id,
    body: r.body,
    author_name: r.author_name,
    created_at: r.created_at,
    like_count: r.likes?.[0]?.count ?? 0,
    user_liked: likedReplyIds.has(r.id),
  }));

  return {
    thread: thread as (Thread & WithLikes) | null,
    threadLikeCount: (thread as WithLikes | null)?.likes?.[0]?.count ?? 0,
    threadLiked,
    replies,
  };
}

export async function createThread(params: {
  userId: string;
  authorName: string;
  title: string;
  body: string;
  category: string;
}): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      user_id: params.userId,
      title: params.title.trim(),
      body: params.body.trim(),
      category: params.category,
      author_name: params.authorName,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "No se pudo publicar." };
  return { id: data.id as string, error: null };
}

export async function createReply(params: {
  threadId: string;
  userId: string;
  authorName: string;
  body: string;
}): Promise<string | null> {
  const { error } = await supabase.from("forum_replies").insert({
    thread_id: params.threadId,
    user_id: params.userId,
    body: params.body.trim(),
    author_name: params.authorName,
  });
  return error ? error.message : null;
}

export async function toggleThreadLike(threadId: string, userId: string) {
  const { data } = await supabase
    .from("forum_thread_likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("thread_id", threadId)
    .maybeSingle();
  if (data) {
    await supabase.from("forum_thread_likes").delete().eq("user_id", userId).eq("thread_id", threadId);
  } else {
    await supabase.from("forum_thread_likes").insert({ user_id: userId, thread_id: threadId });
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
