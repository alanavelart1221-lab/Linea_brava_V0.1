"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/cart";
import type { ShippingAddress } from "@/lib/providers";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://lineabrava.mx";

interface MPPreferenceItem {
  title:       string;
  unit_price:  number;
  quantity:    number;
  currency_id: string;
  picture_url?: string;
}

interface MPPreferenceResponse {
  id:          string;
  init_point:  string;
  sandbox_init_point: string;
}

export async function crearOrden(
  items: CartItem[],
  shippingAddress: ShippingAddress
): Promise<{ preferenceUrl: string } | { error: string }> {
  const supabase = await createClient();

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para completar tu compra." };

  if (!items.length) return { error: "El carrito está vacío." };

  // Validar campos de envío
  const required: (keyof ShippingAddress)[] = ["nombre", "calle", "colonia", "ciudad", "estado", "cp", "telefono"];
  for (const field of required) {
    if (!shippingAddress[field]?.trim()) {
      return { error: "Completa todos los campos de envío." };
    }
  }

  // Verificar que los productos existen y están activos
  const productIds = items.map((i) => i.productId);
  const { data: dbProducts } = await supabase
    .from("provider_products")
    .select("id, name, price, stock, active, provider_id")
    .in("id", productIds)
    .eq("active", true);

  if (!dbProducts || dbProducts.length !== productIds.length) {
    return { error: "Uno o más productos ya no están disponibles." };
  }

  // Verificar stock
  for (const item of items) {
    const dbProd = dbProducts.find((p) => p.id === item.productId);
    if (!dbProd) return { error: `Producto no encontrado: ${item.name}` };
    if (dbProd.stock !== null && dbProd.stock < item.quantity) {
      return { error: `Stock insuficiente para "${item.name}". Disponibles: ${dbProd.stock}.` };
    }
  }

  // Calcular total usando precios del DB (nunca confiar en el cliente)
  const total = dbProducts.reduce((sum, dbProd) => {
    const cartItem = items.find((i) => i.productId === dbProd.id)!;
    return sum + (dbProd.price ?? 0) * cartItem.quantity;
  }, 0);

  // Crear orden en DB
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      buyer_id:         user.id,
      status:           "pendiente",
      total_mxn:        total,
      shipping_address: shippingAddress,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { error: "No se pudo crear la orden. Intenta de nuevo." };
  }

  // Insertar ítems
  const orderItems = dbProducts.map((dbProd) => {
    const cartItem = items.find((i) => i.productId === dbProd.id)!;
    return {
      order_id:          order.id,
      provider_id:       dbProd.provider_id,
      product_id:        dbProd.id,
      product_name:      cartItem.name,
      product_image_url: cartItem.imageUrl,
      unit_price:        dbProd.price ?? 0,
      quantity:          cartItem.quantity,
      subtotal:          (dbProd.price ?? 0) * cartItem.quantity,
    };
  });

  const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
  if (itemsErr) {
    // Limpiar la orden huérfana
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "No se pudo guardar los productos de la orden." };
  }

  // Crear preferencia en Mercado Pago
  const mpItems: MPPreferenceItem[] = items.map((item) => {
    const dbProd = dbProducts.find((p) => p.id === item.productId)!;
    return {
      title:       item.name,
      unit_price:  dbProd.price ?? 0,
      quantity:    item.quantity,
      currency_id: "MXN",
      ...(item.imageUrl ? { picture_url: item.imageUrl } : {}),
    };
  });

  let preferenceUrl: string;

  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items:             mpItems,
        external_reference: order.id,
        back_urls: {
          success: `${BASE_URL}/checkout/success`,
          failure: `${BASE_URL}/checkout/failure`,
          pending: `${BASE_URL}/checkout/success`,
        },
        auto_return:       "approved",
        notification_url:  `${BASE_URL}/api/mp/webhook`,
        statement_descriptor: "LINEA BRAVA",
      }),
    });

    if (!mpRes.ok) {
      const body = await mpRes.text();
      console.error("MP error:", body);
      return { error: "No se pudo iniciar el pago. Intenta de nuevo." };
    }

    const mpData: MPPreferenceResponse = await mpRes.json();

    // Guardar preference_id en la orden
    await supabase
      .from("orders")
      .update({ mp_preference_id: mpData.id })
      .eq("id", order.id);

    // En sandbox usa sandbox_init_point, en producción usa init_point
    preferenceUrl = MP_ACCESS_TOKEN.startsWith("TEST")
      ? mpData.sandbox_init_point
      : mpData.init_point;
  } catch (err) {
    console.error("MP fetch error:", err);
    return { error: "Error de conexión con el servicio de pago." };
  }

  return { preferenceUrl };
}
