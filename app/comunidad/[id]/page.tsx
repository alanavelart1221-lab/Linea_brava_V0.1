import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/relativeTime";
import { isAdmin } from "@/lib/auth";
import { ReplyForm } from "./ReplyForm";
import { LikeButton } from "./LikeButton";
import { DeleteReplyButton } from "./DeleteReplyButton";
import { DeletePostButton } from "./DeletePostButton";
import { extractVideoEmbed } from "@/lib/videoEmbed";
import { SignInCard } from "../SignInCard";
import { MediaGrid } from "../MediaGrid";
import { VideoEmbed } from "../VideoEmbed";
import { Avatar } from "../Avatar";
import { togglePostLike, toggleReplyLike } from "../actions";

export const revalidate = 0;

type Reply = {
  id: string;
  body: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  like_count: number;
  user_liked: boolean;
  image_urls: string[];
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const admin = await isAdmin();

  const [{ data: post }, { data: rawReplies }] = await Promise.all([
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

  if (!post) notFound();

  const [postLikedData, replyLikedData] = await Promise.all([
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

  const userLikedPost = !!postLikedData.data;
  const likedReplyIds = new Set((replyLikedData.data ?? []).map((r: any) => r.reply_id));

  const replies: Reply[] = (rawReplies ?? []).map((r: any) => ({
    id: r.id,
    body: r.body,
    author_name: r.author_name,
    author_avatar: r.author_avatar ?? null,
    created_at: r.created_at,
    like_count: r.likes?.[0]?.count ?? 0,
    user_liked: likedReplyIds.has(r.id),
    image_urls: r.image_urls ?? [],
  }));

  const postLikeCount = post.likes?.[0]?.count ?? 0;
  const boundTogglePostLike = togglePostLike.bind(null, id);
  const postVideo = extractVideoEmbed(post.body ?? "");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell max-w-3xl">
          {/* Back */}
          <Link
            href="/comunidad"
            className="mb-8 flex items-center gap-2 text-sm text-mute hover:text-bone"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver a la comunidad
          </Link>

          {/* Post */}
          <article className="card-line p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Avatar name={post.author_name} avatarUrl={post.author_avatar ?? null} />
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="truncate font-semibold text-bone">{post.author_name}</span>
                <span className="text-mute">·</span>
                <span className="shrink-0 text-xs text-mute">
                  {relativeTime(post.created_at)}
                </span>
              </div>
            </div>
            {postVideo.text && (
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-bone/90">
                {postVideo.text}
              </p>
            )}
            {postVideo.embedUrl && <VideoEmbed embedUrl={postVideo.embedUrl} />}
            <MediaGrid imageUrls={post.image_urls ?? []} />
            <div className="mt-6 flex items-center justify-between border-t border-ink-700 pt-4">
              <div className="flex items-center gap-3">
                <LikeButton
                  initialCount={postLikeCount}
                  initialLiked={userLikedPost}
                  onToggle={boundTogglePostLike}
                />
                {!user && (
                  <p className="text-xs text-mute">Inicia sesión para dar like o responder.</p>
                )}
              </div>
              {admin && <DeletePostButton postId={id} />}
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
                  const replyVideo = extractVideoEmbed(r.body);
                  return (
                    <div key={r.id} className="card-line p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.author_name} avatarUrl={r.author_avatar} size="sm" />
                        <div className="flex min-w-0 items-center gap-2 text-sm">
                          <span className="truncate font-semibold text-bone">
                            {r.author_name}
                          </span>
                          <span className="text-mute">·</span>
                          <span className="shrink-0 text-xs text-mute">
                            {relativeTime(r.created_at)}
                          </span>
                        </div>
                      </div>
                      {replyVideo.text && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bone/90">
                          {replyVideo.text}
                        </p>
                      )}
                      {replyVideo.embedUrl && <VideoEmbed embedUrl={replyVideo.embedUrl} />}
                      <MediaGrid imageUrls={r.image_urls} compact />
                      <div className="mt-4 flex items-center justify-between border-t border-ink-700 pt-3">
                        <LikeButton
                          initialCount={r.like_count}
                          initialLiked={r.user_liked}
                          onToggle={boundToggleReplyLike}
                        />
                        {admin && <DeleteReplyButton replyId={r.id} postId={id} />}
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
              <ReplyForm postId={id} userId={user.id} />
            </section>
          ) : (
            <div className="mt-8">
              <SignInCard
                title="¿Quieres responder?"
                subtitle="Inicia sesión para participar en la comunidad."
                next={`/comunidad/${id}`}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
