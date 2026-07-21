// Lógica pura del carrito, compartida en forma con la web (lib/cart.ts).
// Sin dependencias de plataforma para poder reutilizarse tal cual.

export interface CartItem {
  productId:    string;
  providerId:   string;
  providerName: string;
  name:         string;
  price:        number;
  imageUrl:     string | null;
  quantity:     number;
}

export type CartAction =
  | { type: "ADD_ITEM";    item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QTY";  productId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "LOAD";        items: CartItem[] };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.find((i) => i.productId === action.item.productId);
      if (existing) {
        return state.map((i) =>
          i.productId === action.item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case "REMOVE_ITEM":
      return state.filter((i) => i.productId !== action.productId);
    case "UPDATE_QTY":
      if (action.quantity <= 0) {
        return state.filter((i) => i.productId !== action.productId);
      }
      return state.map((i) =>
        i.productId === action.productId ? { ...i, quantity: action.quantity } : i
      );
    case "CLEAR":
      return [];
    case "LOAD":
      return action.items;
    default:
      return state;
  }
}

export function totalItems(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function totalMxn(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

// Agrupa ítems por proveedor para mostrar en el carrito y en el checkout.
export function groupByProvider(
  items: CartItem[]
): Array<{ providerId: string; providerName: string; items: CartItem[]; subtotal: number }> {
  const map = new Map<string, { providerName: string; items: CartItem[] }>();
  for (const item of items) {
    const group = map.get(item.providerId) ?? { providerName: item.providerName, items: [] };
    group.items.push(item);
    map.set(item.providerId, group);
  }
  return Array.from(map.entries()).map(([providerId, { providerName, items }]) => ({
    providerId,
    providerName,
    items,
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  }));
}
