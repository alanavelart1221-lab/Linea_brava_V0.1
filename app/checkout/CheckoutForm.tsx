"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { crearOrden } from "./actions";
import type { ShippingAddress } from "@/lib/providers";

const ESTADOS_MX = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
  "Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato",
  "Guerrero","Hidalgo","Jalisco","Estado de México","Michoacán","Morelos",
  "Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo",
  "San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala",
  "Veracruz","Yucatán","Zacatecas",
];

function fmtMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function CheckoutForm() {
  const { items, groups, totalMxn, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    nombre:   "",
    calle:    "",
    colonia:  "",
    ciudad:   "",
    estado:   "",
    cp:       "",
    telefono: "",
  });

  function setField(field: keyof ShippingAddress) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAddress((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await crearOrden(items, address);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Limpiar carrito y redirigir a Mercado Pago
    clear();
    router.push(result.preferenceUrl);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-4xl">🛒</p>
        <p className="text-bone">Tu carrito está vacío</p>
        <a href="/marketplace" className="btn-primary">
          Ver marketplace
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-2">
      {/* Dirección de envío */}
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-2xl text-bone">Dirección de envío</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-bone">Nombre completo *</span>
            <input
              required
              value={address.nombre}
              onChange={setField("nombre")}
              className="input-field"
              placeholder="Como aparece en tu identificación"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-bone">Teléfono *</span>
            <input
              required
              type="tel"
              value={address.telefono}
              onChange={setField("telefono")}
              className="input-field"
              placeholder="10 dígitos"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-bone">Código postal *</span>
            <input
              required
              value={address.cp}
              onChange={setField("cp")}
              className="input-field"
              placeholder="00000"
              maxLength={5}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-bone">Calle y número *</span>
            <input
              required
              value={address.calle}
              onChange={setField("calle")}
              className="input-field"
              placeholder="Ej. Av. Insurgentes Sur 1234"
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-bone">Colonia *</span>
            <input
              required
              value={address.colonia}
              onChange={setField("colonia")}
              className="input-field"
              placeholder="Ej. Del Valle"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-bone">Ciudad *</span>
            <input
              required
              value={address.ciudad}
              onChange={setField("ciudad")}
              className="input-field"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-bone">Estado *</span>
            <select
              required
              value={address.estado}
              onChange={setField("estado")}
              className="input-field"
            >
              <option value="">Selecciona un estado</option>
              {ESTADOS_MX.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Resumen del pedido */}
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-2xl text-bone">Tu pedido</h2>

        <div className="card-line flex flex-col divide-y divide-ink-700 overflow-hidden">
          {groups.map((group) => (
            <div key={group.providerId} className="flex flex-col gap-3 p-4">
              <p className="eyebrow text-xs">{group.providerName}</p>
              {group.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-700">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-bone line-clamp-1">{item.name}</p>
                    <p className="text-xs text-mute">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-trail-400">
                    {fmtMxn(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          ))}

          <div className="flex items-center justify-between p-4">
            <span className="font-semibold text-bone">Total</span>
            <span className="font-display text-2xl text-trail-400">{fmtMxn(totalMxn)}</span>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center disabled:opacity-50"
        >
          {loading ? "Procesando…" : "Pagar con Mercado Pago"}
        </button>

        <p className="text-center text-xs text-mute">
          Serás redirigido a Mercado Pago para completar tu pago de forma segura.
          Aceptamos tarjeta, OXXO y transferencia.
        </p>
      </div>
    </form>
  );
}
