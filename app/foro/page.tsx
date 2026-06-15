import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 30;

const CATEGORIES = ["Rutas", "Mecánica", "Overland & Equipo", "General"] as const;

type Thread = {
  id: string;
  title: string;
  body: string;
  category: string;
  author_name: string;
  created_at: string;
  reply_count: number;
  like_count: number;
};

export default async function ForoPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const activeCategory = CATEGORIES.find((c) => c === cat) ?? null;

  const supabase = await createClient();

  let query = supabase
    .from("forum_threads")
    .select("id, title, body, category, author_name, created_at, replies:forum_replies(count), likes:forum_thread_likes(count)")
    .order("created_at", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  const { data: rawThreads } = await query;

  const threads: Thread[] = (rawThreads ?? []).map((t: any) => ({
    id: t.id,
    title: t.title,
    body: t.body,
    category: t.category,
    author_name: t.author_name,
    created_at: t.created_at,
    reply_count: t.replies?.[0]?.count ?? 0,
    like_count: t.likes?.[0]?.count ?? 0,
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <div className="shell">
          <Reveal className="mb-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow mb-4 flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-trail-500" />
                  Comunidad
                </span>
                <h1 className="h2 text-trail-500">Foro</h1>
                <p className="mt-3 max-w-md text-mute">
                  Pregunta, comparte y conecta con otros off-roaders.
                </p>
              </div>
              <Link href="/foro/nuevo" className="btn-primary shrink-0">
                + Nuevo hilo
              </Link>
            </div>
          </Reveal>

          {/* Category pills */}
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/foro"
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                !activeCategory
                  ? "border-trail-500 bg-trail-500 text-ink-950"
                  : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
              }`}
            >
              Todos
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/foro?cat=${encodeURIComponent(c)}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === c
                    ? "border-trail-500 bg-trail-500 text-ink-950"
                    : "border-ink-600 text-mute hover:border-ink-400 hover:text-bone"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>

          {/* Threads */}
          {threads.length > 0 ? (
            <div className="flex flex-col gap-3">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/foro/${t.id}`}
                  className="card-line block p-5 transition-colors hover:border-trail-400/50 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs font-semibold text-mute">
                          {t.category}
                        </span>
                      </div>
                      <h2 className="font-display text-xl text-bone sm:text-2xl">{t.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-mute">{t.body}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-mute">
                        <span>{t.author_name}</span>
                        <span>·</span>
                        <span>
                          {new Date(t.created_at).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-end sm:gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-mute">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{t.reply_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-mute">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{t.like_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="text-lg text-bone">No hay hilos todavía.</p>
              <p className="text-sm text-mute">¡Sé el primero en abrir una conversación!</p>
              <Link href="/foro/nuevo" className="btn-primary mt-2">
                Crear hilo
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
