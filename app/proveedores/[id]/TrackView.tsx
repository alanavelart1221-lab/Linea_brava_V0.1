"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Registra una "vista" del perfil del proveedor (una vez por carga).
 * La RPC excluye al propio dueño, a los admins y a proveedores no visibles.
 */
export function TrackView({ providerId }: { providerId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const supabase = createClient();
    supabase
      .rpc("track_provider_event", { p_provider_id: providerId, p_tipo: "vista" })
      .then(() => {});
  }, [providerId]);

  return null;
}
