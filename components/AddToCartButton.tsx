"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import type { MarketplaceProduct } from "@/lib/providers";

interface Props {
  product: Pick<
    MarketplaceProduct,
    "id" | "provider_id" | "provider_name" | "name" | "price" | "image_url" | "stock"
  >;
  className?: string;
}

export function AddToCartButton({ product, className }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock !== null && product.stock <= 0;

  function handleAdd() {
    if (outOfStock || product.price === null) return;
    addItem({
      productId:    product.id,
      providerId:   product.provider_id,
      providerName: product.provider_name,
      name:         product.name,
      price:        product.price,
      imageUrl:     product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (outOfStock) {
    return (
      <button
        disabled
        className={`btn-ghost cursor-not-allowed opacity-50 ${className ?? ""}`}
      >
        Sin stock
      </button>
    );
  }

  if (product.price === null) {
    return (
      <button
        disabled
        className={`btn-ghost cursor-not-allowed opacity-50 ${className ?? ""}`}
      >
        Precio no disponible
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`btn-primary transition-all ${added ? "bg-go-500 hover:bg-go-500" : ""} ${className ?? ""}`}
    >
      {added ? "¡Agregado ✓" : "Agregar al carrito"}
    </button>
  );
}
