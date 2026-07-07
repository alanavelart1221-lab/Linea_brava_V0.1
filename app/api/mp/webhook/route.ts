import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const MP_ACCESS_TOKEN  = process.env.MP_ACCESS_TOKEN  ?? "";
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET ?? "";

// Mercado Pago envía esta cabecera para validar la autenticidad del webhook.
function verifyMPSignature(req: NextRequest, rawBody: string): boolean {
  const xSignature   = req.headers.get("x-signature")   ?? "";
  const xRequestId   = req.headers.get("x-request-id")  ?? "";
  const urlSearchParams = new URL(req.url).searchParams;
  const dataId = urlSearchParams.get("data.id") ?? "";

  // Formato: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, val] = part.split("=");
    if (key && val) parts[key.trim()] = val.trim();
  });

  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest("hex");

  return expected === parts.v1;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verificar firma solo en producción (el secret puede estar vacío en dev)
  if (MP_WEBHOOK_SECRET && !verifyMPSignature(req, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { type?: string; data?: { id?: string } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true }); // retornar 200 siempre a MP
  }

  // Solo nos interesan los eventos de pago
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = body.data.id;

  // Consultar el pago a la API de MP
  let payment: { status?: string; external_reference?: string; id?: string };
  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );
    if (!res.ok) return NextResponse.json({ ok: true });
    payment = await res.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (payment.status !== "approved" || !payment.external_reference) {
    return NextResponse.json({ ok: true });
  }

  // Actualizar la orden en Supabase usando la RPC que también notifica al proveedor.
  // Se usa el cliente service_role: la RPC está restringida a ese rol (migración 0016)
  // y este webhook llega desde Mercado Pago, sin sesión de usuario.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY no configurada; no se pudo confirmar la orden", payment.external_reference);
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      serviceRoleKey,
      { auth: { persistSession: false } }
    );
    await supabase.rpc("confirm_order_payment", {
      p_order_id:      payment.external_reference,
      p_mp_payment_id: String(paymentId),
      p_mp_status:     payment.status,
    });
  } catch (err) {
    console.error("Error confirming order:", err);
  }

  // Siempre retornar 200 para que MP no reintente
  return NextResponse.json({ ok: true });
}
