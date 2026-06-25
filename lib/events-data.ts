import { createClient } from "@/lib/supabase/server";
import type { EventItem } from "@/lib/data";

/** Mapea una fila de `user_events` a la forma que consumen las tarjetas. */
function normalize(e: Record<string, unknown>): EventItem {
  return {
    id: e.id as string,
    date: e.date as string,
    title: e.title as string,
    location: e.location as string,
    level: e.level as EventItem["level"],
    spots: (e.spots as number) ?? 0,
    spotsLeft: (e.spots_left as number) ?? 0,
    tag: (e.tag as string) ?? "",
  };
}

/** Todos los eventos aprobados, próximos primero. */
export async function getApprovedEvents(): Promise<EventItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_events")
    .select("*")
    .eq("status", "approved")
    .order("date", { ascending: true });
  return ((data as Record<string, unknown>[] | null) ?? []).map(normalize);
}

/**
 * Eventos aprobados y próximos en un estado dado (para el sidebar de detalle de
 * ruta). `user_events` no se liga a una ruta concreta, así que mostramos los del
 * mismo estado — igual que los proveedores cercanos.
 */
export async function getUpcomingEventsByState(
  state: string,
  limit = 3,
): Promise<EventItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_events")
    .select("*")
    .eq("status", "approved")
    .eq("state", state)
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })
    .limit(limit);
  return ((data as Record<string, unknown>[] | null) ?? []).map(normalize);
}
