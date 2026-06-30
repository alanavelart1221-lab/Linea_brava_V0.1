"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/components/CartProvider";

export default function CheckoutSuccessPage() {
  const { clear } = useCart();

  // Limpiar el carrito al llegar a esta página
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center pb-20 pt-28">
        <div className="shell flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-go-500/15">
            <span className="text-4xl text-go-400">✓</span>
          </div>
          <h1 className="mt-6 font-display text-4xl text-bone">¡Pago recibido!</h1>
          <p className="mt-3 max-w-md text-mute">
            Tu pedido fue confirmado. El proveedor coordinará el envío contigo
            a través de los datos que proporcionaste.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/perfil?seccion=compras" className="btn-primary">
              Ver mis compras
            </Link>
            <Link href="/marketplace" className="btn-ghost">
              Seguir comprando
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
