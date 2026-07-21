import { supabase } from "./supabase";
import type { CartItem } from "./cart";

// Datos de envío que captura el checkout (misma forma que la web).
export interface ShippingAddress {
  nombre:   string;
  telefono: string;
  calle:    string;
  colonia:  string;
  ciudad:   string;
  estado:   string;
  cp:       string;
}

export const ESTADOS_MX: string[] = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán",
  "Zacatecas",
];

const CAMPOS_REQUERIDOS: (keyof ShippingAddress)[] = [
  "nombre", "calle", "colonia", "ciudad", "estado", "cp", "telefono",
];

/**
 * Crea una orden en estado `pendiente` (etapa 1: sin pago Mercado Pago).
 *
 * Replica la validación server-side de `app/checkout/actions.ts` (web): re-consulta
 * `provider_products` para tomar precios/stock autoritativos del DB — nunca confía en los
 * precios del cliente — e inserta `orders` + `order_items` con el usuario autenticado (RLS).
 *
 * En la 2ª etapa, esta función se reemplaza por una llamada a una Supabase Edge Function
 * que además genere la preferencia de Mercado Pago y devuelva la URL de pago.
 */
export async function crearOrdenPendiente(
  items: CartItem[],
  shippingAddress: ShippingAddress
): Promise<{ orderId: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para completar tu compra." };

  if (!items.length) return { error: "El carrito está vacío." };

  for (const field of CAMPOS_REQUERIDOS) {
    if (!shippingAddress[field]?.trim()) {
      return { error: "Completa todos los campos de envío." };
    }
  }

  // Re-consultar productos: precios y stock autoritativos del DB.
  const productIds = items.map((i) => i.productId);
  const { data: dbProducts } = await supabase
    .from("provider_products")
    .select("id, name, price, stock, active, provider_id")
    .in("id", productIds)
    .eq("active", true);

  if (!dbProducts || dbProducts.length !== productIds.length) {
    return { error: "Uno o más productos ya no están disponibles." };
  }

  type DbProduct = {
    id: string;
    name: string;
    price: number | null;
    stock: number | null;
    active: boolean;
    provider_id: string;
  };
  const dbList = dbProducts as DbProduct[];

  // Verificar stock.
  for (const item of items) {
    const dbProd = dbList.find((p) => p.id === item.productId);
    if (!dbProd) return { error: `Producto no encontrado: ${item.name}` };
    if (dbProd.stock !== null && dbProd.stock < item.quantity) {
      return { error: `Stock insuficiente para "${item.name}". Disponibles: ${dbProd.stock}.` };
    }
  }

  // Total con precios del DB.
  const total = dbList.reduce((sum, dbProd) => {
    const cartItem = items.find((i) => i.productId === dbProd.id)!;
    return sum + (dbProd.price ?? 0) * cartItem.quantity;
  }, 0);

  // Crear la orden.
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

  const orderId = (order as { id: string }).id;

  // Insertar los ítems (snapshot de nombre/imagen/precio).
  const orderItems = dbList.map((dbProd) => {
    const cartItem = items.find((i) => i.productId === dbProd.id)!;
    return {
      order_id:          orderId,
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
    // Limpiar la orden huérfana.
    await supabase.from("orders").delete().eq("id", orderId);
    return { error: "No se pudo guardar los productos de la orden." };
  }

  return { orderId };
}
