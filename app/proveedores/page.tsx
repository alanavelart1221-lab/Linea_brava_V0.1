import { createClient } from "@/lib/supabase/server";
import type { Provider, ProviderType } from "@/lib/providers";
import { ProveedoresContent } from "./ProveedoresContent";

export const revalidate = 60;

type ProviderRow = {
  id: string;
  name: string;
  type: string;
  state: string;
  city: string;
  description: string;
  specialty: string[] | null;
  phone: string;
  website: string | null;
  featured: boolean;
};

export default async function ProveedoresPage() {
  const supabase = await createClient();

  // RLS deja ver solo los proveedores con status='aprobado'.
  const { data } = await supabase
    .from("providers")
    .select("id, name, type, state, city, description, specialty, phone, website, featured")
    .eq("status", "aprobado")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const providers: Provider[] = ((data as ProviderRow[] | null) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as ProviderType,
    state: p.state,
    city: p.city,
    description: p.description,
    specialty: p.specialty ?? [],
    phone: p.phone,
    website: p.website ?? undefined,
    featured: p.featured,
  }));

  return <ProveedoresContent providers={providers} />;
}
