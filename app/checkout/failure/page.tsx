import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Pago fallido",
};

export default function CheckoutFailurePage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center pb-20 pt-28">
        <div className="shell flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
            <span className="text-4xl text-red-400">✕</span>
          </div>
          <h1 className="mt-6 font-display text-4xl text-bone">Pago no completado</h1>
          <p className="mt-3 max-w-md text-mute">
            Hubo un problema al procesar tu pago. Tu pedido no fue cobrado.
            Puedes intentarlo de nuevo o elegir otro método de pago.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/checkout" className="btn-primary">
              Intentar de nuevo
            </Link>
            <Link href="/marketplace" className="btn-ghost">
              Volver al marketplace
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
