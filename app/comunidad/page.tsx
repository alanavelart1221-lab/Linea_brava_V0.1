import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/relativeTime";
import { Composer } from "./Composer";
import { SignInCard } from "./SignInCard";
import { MediaGrid } from "./MediaGrid";
import { Avatar } from "./Avatar";
import { LikeButton } from "./[id]/LikeButton";
import { togglePostLike } from "./actions";

export const revalidate = 0;

const PAGE_SIZE = 20;

type Post = {
  id: string;
  body: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  image_urls: string[];
  reply_count: number;
  like_count: number;
  user_liked: boolean;
};

export default async function ComunidadPage({
  searchParams,
}: {
  searchParams: Promise<{ mostrar?: string }>;
}) {
  const { mostrar } = await searchParams;
  const limit = Math.min(Math.max(Number(mostrar) || PAGE_SIZE, PAGE_SIZE), 200);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawPosts } = await supabase
    .from("forum_threads")
    .select(
      "id, body, author_name, author_avatar, created_at, image_urls, replies:forum_replies(count), likes:forum_thread_likes(count)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const ids = (rawPosts ?? []).map((p: any) => p.id);
  const { data: likedRows } =
    user && ids.length > 0
      ? await supabase
          .from("forum_thread_likes")
          .select("thread_id")
          .eq("user_id", user.id)
          .in("thread_id", ids)
      : { data: [] };
  const likedIds = new Set((likedRows ?? []).map((r: any) => r.thread_id));

  const posts: Post[] = (rawPosts ?? []).map((p: any) => ({
    id: p.id,
    body: p.body,
    author_name: p.author_name,
    author_avatar: p.author_avatar ?? null,
    created_at: p.created_at,
    image_urls: p.image_urls ?? [],
    reply_count: p.replies?.[0]?.count ?? 0,
    like_count: p.likes?.[0]?.count ?? 0,
    user_liked: likedIds.has(p.id),
  }));

  const userName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Miembro";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell max-w-3xl">
          <Reveal className="mb-8">
            <span className="eyebrow mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
              La banda off-road
            </span>
            <h1 className="h2 text-trail-500">Comunidad</h1>
            <p className="mt-3 max-w-md text-mute">
              Comparte tus salidas, pregunta y conecta con otros off-roaders.
            </p>
          </Reveal>

          {/* Composer / login */}
          <div className="mb-8">
            {user ? (
              <Composer userId={user.id} userName={userName} avatarUrl={avatarUrl} />
            ) : (
              <SignInCard
                title="Únete a la conversación"
                subtitle="Inicia sesión para publicar en la comunidad."
                next="/comunidad"
              />
            )}
          </div>

          {/* Feed */}
          {posts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {posts.map((p) => {
                const boundToggleLike = togglePostLike.bind(null, p.id);
                return (
                  <article
                    key={p.id}
                    className="card-line p-5 transition-colors hover:border-trail-400/50 sm:p-6"
                  >
                    <Link href={`/comunidad/${p.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.author_name} avatarUrl={p.author_avatar} />
                        <div className="flex min-w-0 items-center gap-2 text-sm">
                          <span className="truncate font-semibold text-bone">
                            {p.author_name}
                          </span>
                          <span className="text-mute">·</span>
                          <span className="shrink-0 text-xs text-mute">
                            {relativeTime(p.created_at)}
                          </span>
                        </div>
                      </div>
                      {p.body && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bone/90">
                          {p.body}
                        </p>
                      )}
                      <MediaGrid imageUrls={p.image_urls} compact />
                    </Link>

                    <div className="mt-4 flex items-center gap-3 border-t border-ink-700 pt-3">
                      <LikeButton
                        initialCount={p.like_count}
                        initialLiked={p.user_liked}
                        onToggle={boundToggleLike}
                      />
                      <Link
                        href={`/comunidad/${p.id}`}
                        className="flex items-center gap-1.5 rounded-full border border-ink-600 px-3 py-1.5 text-sm font-semibold text-mute transition-colors hover:border-ink-400 hover:text-bone"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {p.reply_count}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-lg text-bone">Todavía no hay publicaciones.</p>
              <p className="text-sm text-mute">¡Sé el primero en compartir algo!</p>
            </div>
          )}

          {/* Paginación mínima */}
          {posts.length >= limit && (
            <div className="mt-8 text-center">
              <Link
                href={`/comunidad?mostrar=${limit + PAGE_SIZE}`}
                className="inline-block rounded-full border border-ink-600 px-6 py-2.5 text-sm font-semibold text-mute transition-colors hover:border-ink-400 hover:text-bone"
              >
                Ver más
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
