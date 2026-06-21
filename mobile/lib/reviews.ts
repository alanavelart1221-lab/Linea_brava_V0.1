import { supabase } from "./supabase";

export interface RouteReview {
  id: string;
  user_id: string;
  user_route_id: string | null;
  trail_slug: string | null;
  rating: number;
  body: string | null;
  author_name: string;
  created_at: string;
}

export function reviewStats(reviews: Pick<RouteReview, "rating">[]) {
  const count = reviews.length;
  if (count === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return { average: Math.round((sum / count) * 10) / 10, count };
}

export async function fetchReviews(userRouteId: string): Promise<RouteReview[]> {
  const { data } = await supabase
    .from("route_reviews")
    .select("*")
    .eq("user_route_id", userRouteId)
    .order("created_at", { ascending: false });
  return (data as RouteReview[] | null) ?? [];
}

/** Crea o actualiza la reseña del usuario para una ruta de comunidad. */
export async function saveReview(params: {
  userRouteId: string;
  userId: string;
  authorName: string;
  rating: number;
  body: string | null;
  existingId: string | null;
}): Promise<string | null> {
  if (params.existingId) {
    const { error } = await supabase
      .from("route_reviews")
      .update({ rating: params.rating, body: params.body, updated_at: new Date().toISOString() })
      .eq("id", params.existingId);
    return error ? error.message : null;
  }
  const { error } = await supabase.from("route_reviews").insert({
    user_id: params.userId,
    user_route_id: params.userRouteId,
    rating: params.rating,
    body: params.body,
    author_name: params.authorName,
  });
  return error ? error.message : null;
}

export async function deleteReview(id: string) {
  await supabase.from("route_reviews").delete().eq("id", id);
}
