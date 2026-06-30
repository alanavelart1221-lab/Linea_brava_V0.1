import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// --------------------------------------------------------
// Tipos de respuesta
// --------------------------------------------------------
export interface ImportedProduct {
  name:        string;
  description: string | null;
  price:       number | null;
  image_url:   string | null;
  external_url: string;
  source_id:   string | null;
  category:    string | null;
}

export interface ImportResponse {
  platform:           "mercadolibre" | "web" | "unknown";
  products:           ImportedProduct[];
  seller_id_or_store: string | null;
  error?:             string;
}

// --------------------------------------------------------
// Detección de plataforma
// --------------------------------------------------------
function detectPlatform(url: string): "mercadolibre" | "web" {
  try {
    const host = new URL(url).hostname;
    if (host.includes("mercadolibre") || host.includes("mercadoli")) {
      return "mercadolibre";
    }
  } catch {
    // URL malformada
  }
  return "web";
}

// Extrae el store name o seller_id del path de una URL de ML.
// Ejemplos:
//   https://www.mercadolibre.com.mx/tienda/TallerX4    → TallerX4
//   https://lista.mercadolibre.com.mx/...              → usa query ?seller_id
function extractMLStore(url: string): { storeName: string | null; sellerId: string | null } {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    const tiendaIdx = segments.findIndex((s) => s === "tienda");
    if (tiendaIdx !== -1 && segments[tiendaIdx + 1]) {
      return { storeName: segments[tiendaIdx + 1], sellerId: null };
    }
    const sellerId = u.searchParams.get("seller_id");
    if (sellerId) return { storeName: null, sellerId };
    // Último segmento como fallback
    const last = segments[segments.length - 1];
    if (last) return { storeName: last, sellerId: null };
  } catch {
    // ignore
  }
  return { storeName: null, sellerId: null };
}

// Mapea categoría de ML (heurística básica) a nuestras categorías.
function mapMLCategory(categoryId: string | null | undefined): string {
  if (!categoryId) return "otros";
  const id = categoryId.toUpperCase();
  if (id.includes("LLANTA") || id.includes("NEUMATICO")) return "neumaticos";
  if (id.includes("HERRAMIENTA")) return "herramientas";
  if (id.includes("ACCESORIO") || id.includes("ACCESORIOS")) return "accesorios";
  if (id.includes("MOTOR") || id.includes("SUSPENSION") || id.includes("REFACCION")) return "partes";
  return "otros";
}

// --------------------------------------------------------
// Importar desde MercadoLibre (API pública, sin auth)
// --------------------------------------------------------
async function importFromML(url: string): Promise<ImportResponse> {
  const { storeName, sellerId } = extractMLStore(url);
  const storeKey = storeName ?? sellerId ?? null;

  let searchUrl: string;
  if (storeName) {
    searchUrl = `https://api.mercadolibre.com/sites/MLM/search?nickname=${encodeURIComponent(storeName)}&limit=50`;
  } else if (sellerId) {
    searchUrl = `https://api.mercadolibre.com/sites/MLM/search?seller_id=${sellerId}&limit=50`;
  } else {
    return {
      platform: "mercadolibre",
      products: [],
      seller_id_or_store: null,
      error: "No se pudo identificar la tienda. Asegúrate de que la URL sea de una tienda de MercadoLibre.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let data: { results?: Array<{
    id: string;
    title: string;
    price?: number;
    thumbnail?: string;
    permalink?: string;
    category_id?: string;
    condition?: string;
  }>; error?: string };

  try {
    const res = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return { platform: "mercadolibre", products: [], seller_id_or_store: storeKey, error: "No se encontró la tienda en MercadoLibre." };
    }
    data = await res.json();
  } catch {
    clearTimeout(timeout);
    return { platform: "mercadolibre", products: [], seller_id_or_store: storeKey, error: "No se pudo conectar con MercadoLibre. Intenta de nuevo." };
  }

  if (!data.results?.length) {
    return {
      platform: "mercadolibre",
      products: [],
      seller_id_or_store: storeKey,
      error: "La tienda no tiene productos públicos o el nombre es incorrecto.",
    };
  }

  const products: ImportedProduct[] = data.results.map((item) => ({
    name:        item.title,
    description: null,
    price:       item.price ?? null,
    image_url:   item.thumbnail
      ? item.thumbnail.replace(/-I\.jpg$/, "-O.jpg").replace(/^http:/, "https:")
      : null,
    external_url: item.permalink ?? "",
    source_id:   item.id,
    category:    mapMLCategory(item.category_id),
  }));

  return { platform: "mercadolibre", products, seller_id_or_store: storeKey };
}

// --------------------------------------------------------
// Importar desde un sitio web (scraping básico de OG + JSON-LD)
// --------------------------------------------------------
async function importFromWeb(url: string): Promise<ImportResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LineaBravaBot/1.0; +https://lineabrava.mx)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { platform: "web", products: [], seller_id_or_store: null, error: "No se pudo acceder al sitio." };
    }
    html = await res.text();
  } catch {
    clearTimeout(timeout);
    return { platform: "web", products: [], seller_id_or_store: null, error: "El sitio no respondió a tiempo (>8 s)." };
  }

  // 1. Intentar JSON-LD con @type Product
  const ldJsonMatches = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  ) ?? [];

  const ldProducts: ImportedProduct[] = [];

  for (const block of ldJsonMatches) {
    try {
      const inner = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
      const parsed = JSON.parse(inner);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"] === "Product") {
          ldProducts.push({
            name:        item.name ?? "Producto",
            description: item.description ?? null,
            price:       item.offers?.price ? Number(item.offers.price) : null,
            image_url:   Array.isArray(item.image) ? item.image[0] : item.image ?? null,
            external_url: url,
            source_id:   null,
            category:    "otros",
          });
        }
      }
    } catch {
      // JSON malformado — ignorar
    }
  }

  if (ldProducts.length > 0) {
    return { platform: "web", products: ldProducts, seller_id_or_store: null };
  }

  // 2. Fallback: Open Graph tags
  function ogTag(property: string): string | null {
    const match = html.match(
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")
    ) ?? html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i")
    );
    return match?.[1] ?? null;
  }

  const title       = ogTag("og:title");
  const description = ogTag("og:description");
  const image       = ogTag("og:image");
  const priceRaw    = ogTag("og:price:amount") ?? ogTag("product:price:amount");

  if (title) {
    return {
      platform: "web",
      seller_id_or_store: null,
      products: [{
        name:        title,
        description: description ?? null,
        price:       priceRaw ? Number(priceRaw) : null,
        image_url:   image ?? null,
        external_url: url,
        source_id:   null,
        category:    "otros",
      }],
    };
  }

  return {
    platform: "web",
    products: [],
    seller_id_or_store: null,
    error: "No se encontraron productos en el sitio. Asegúrate de que la URL sea de una tienda o producto.",
  };
}

// --------------------------------------------------------
// Handler principal
// --------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { url?: string; providerId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { url, providerId } = body;
  if (!url || !providerId) {
    return NextResponse.json({ error: "Faltan parámetros url y providerId" }, { status: 400 });
  }

  // Verificar que el proveedor pertenece al usuario
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("id", providerId)
    .eq("user_id", user.id)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "No tienes permiso para este proveedor" }, { status: 403 });
  }

  const platform = detectPlatform(url);
  const result: ImportResponse =
    platform === "mercadolibre"
      ? await importFromML(url)
      : await importFromWeb(url);

  return NextResponse.json(result);
}
