"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Botones de contacto (teléfono / sitio web / cotización) que registran un
 * evento de "contacto" al hacer clic. El conteo lo filtra la RPC (no cuenta al
 * dueño ni a admins).
 */
export function ContactoTracker({
  providerId,
  phone,
  website,
}: {
  providerId: string;
  phone: string;
  website: string | null;
}) {
  function track() {
    const supabase = createClient();
    supabase
      .rpc("track_provider_event", { p_provider_id: providerId, p_tipo: "contacto" })
      .then(() => {});
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 sm:w-64">
      <a
        href={`tel:${phone}`}
        onClick={track}
        className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-center text-sm font-medium text-bone transition-colors hover:border-trail-500/50 hover:text-trail-400"
      >
        {phone}
      </a>
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={track}
          className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-center text-sm font-medium text-bone transition-colors hover:border-trail-500/50 hover:text-trail-400"
        >
          Sitio web
        </a>
      )}
      <a href="#cotizar" onClick={track} className="btn-primary text-center">
        Solicitar cotización
      </a>
    </div>
  );
}
