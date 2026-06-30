import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/perfil");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 pt-28">
        <div className="shell">
          <div className="mb-10">
            <h1 className="font-display text-4xl text-bone">Finalizar compra</h1>
          </div>
          <CheckoutForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
