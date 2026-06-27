import { createClient } from "@/lib/supabase/server";
import {
  ESTADOS_PUBLICOS,
  PROVIDER_COLUMNS,
  mapProviderRow,
  type Provider,
  type ProviderRow,
} from "@/lib/providers";
import { ProveedoresContent } from "./ProveedoresContent";

export const revalidate = 60;

export default async function ProveedoresPage() {
  const supabase = await createClient();

  // RLS deja ver solo los proveedores públicos (en prueba o activos).
  const { data } = await supabase
    .from("providers")
    .select(PROVIDER_COLUMNS)
    .in("estado", ESTADOS_PUBLICOS)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const providers: Provider[] = ((data as ProviderRow[] | null) ?? []).map(
    mapProviderRow
  );

  return <ProveedoresContent providers={providers} />;
}
