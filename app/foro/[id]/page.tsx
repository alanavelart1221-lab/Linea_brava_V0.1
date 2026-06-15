import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ReplyForm } from "./ReplyForm";
import { LikeButton } from "./LikeButton";
import { SignInToReply } from "./SignInToReply";
import { createReply, toggleThreadLike, toggleReplyLike } from "@/app/foro/actions";

export const revalidate = 0;

type Reply = {
  id: string;
  body: string;
  author_name: string;
  created_at: string;
  like_count: number;
  user_liked: boolean;
  image_url: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: thread }, { data: rawReplies }] = await Promise.all([
    supabase
      .from("forum_threads")
      .select("*, likes:forum_thread_likes(count)")
      .eq("id", id)
      .single(),
    supabase
      .from("forum_replies")
      .select("*, likes:forum_reply_likes(count)")
      .eq("thread_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!thread) notFound();

  const [threadLikedData, replyLikedData] = await Promise.all([
    user
      ? supabase
          .from("forum_thread_likes")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("thread_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user && (rawReplies ?? []).length > 0
      ? supabase
          .from("forum_reply_likes")
          .select("reply_id")
          .eq("user_id", user.id)
          .in("reply_id", (rawReplies ?? []).map((r: any) => r.id))
      : Promise.resolve({ data: [] }),
  ]);

  const userLikedThreadId = !!threadLikedData.data;
  const likedReplyIds = new Set((replyLikedData.data ?? []).map((r: any) => r.reply_id));

  const replies: Reply[] = (rawReplies ?? []).map((r: any) => ({
    id: r.id,
    body: r.body,
    author_name: r.author_name,
    created_at: r.created_at,
    like_count: r.likes?.[0]?.count ?? 0,
    user_liked: likedReplyIds.has(r.id),
    image_url: r.image_url ?? null,
  }));

  const threadLikeCount = thread.likes?.[0]?.count ?? 0;

  const boundCreateReply = createReply.bind(null, id);
  const boundToggleThreadLike = toggleThreadLike.bind(null, id);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell max-w-3xl">
          {/* Back */}
          <Link href="/foro" className="mb-8 flex items-center gap-2 text-sm text-mute hover:text-bone">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver al foro
          </Link>

          {/* Thread */}
          <article className="card-line p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs font-semibold text-mute">
                {thread.category}
              </span>
            </div>
            <h1 className="font-display text-2xl text-bone sm:text-3xl">{thread.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-mute">
              <span className="font-semibold text-trail-400">{thread.author_name}</span>
              <span>·</span>
              <span>{formatDate(thread.created_at)}</span>
            </div>
            <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-mute">
              {thread.body}
            </p>
            {thread.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thread.image_url}
                alt="Imagen del hilo"
                className="mt-5 max-h-[480px] w-full rounded-xl object-cover"
              />
            )}
            <div className="mt-6 flex items-center gap-3 border-t border-ink-700 pt-4">
              <LikeButton
                initialCount={threadLikeCount}
                initialLiked={userLikedThreadId}
                onToggle={boundToggleThreadLike}
              />
              {!user && (
                <p className="text-xs text-mute">
                  Inicia sesión para dar like o responder.
                </p>
              )}
            </div>
          </article>

          {/* Replies */}
          {replies.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-mute">
                {replies.length} {replies.length === 1 ? "respuesta" : "respuestas"}
              </h2>
              <div className="flex flex-col gap-4">
                {replies.map((r) => {
                  const boundToggleReplyLike = toggleReplyLike.bind(null, r.id, id);
                  return (
                    <div key={r.id} className="card-line p-5 sm:p-6">
                      <div className="mb-1 flex items-center gap-2 text-xs text-mute">
                        <span className="font-semibold text-trail-400">{r.author_name}</span>
                        <span>·</span>
                        <span>{formatDate(r.created_at)}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-mute">
                        {r.body}
                      </p>
                      {r.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.image_url}
                          alt="Imagen de respuesta"
                          className="mt-3 max-h-72 w-full rounded-xl object-cover"
                        />
                      )}
                      <div className="mt-4 border-t border-ink-700 pt-3">
                        <LikeButton
                          initialCount={r.like_count}
                          initialLiked={r.user_liked}
                          onToggle={boundToggleReplyLike}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Reply form */}
          {user ? (
            <section className="mt-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-mute">
                Tu respuesta
              </h2>
              <ReplyForm onSubmit={boundCreateReply} />
            </section>
          ) : (
            <SignInToReply />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
