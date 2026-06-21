// Reseñas de rutas (tabla `route_reviews`). Una reseña editable por usuario por
// ruta; soporta rutas oficiales (trail_slug) y de comunidad (user_route_id).

export interface RouteReview {
  id: string;
  user_id: string;
  trail_slug: string | null;
  user_route_id: string | null;
  rating: number;
  body: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
}

/** Promedio de estrellas (1 decimal) y conteo de una lista de reseñas. */
export function reviewStats(reviews: Pick<RouteReview, "rating">[]): {
  average: number;
  count: number;
} {
  const count = reviews.length;
  if (count === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: Math.round((sum / count) * 10) / 10, count };
}
