import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CartItem,
  cartReducer,
  groupByProvider,
  totalItems,
  totalMxn,
} from "./cart";

// Misma clave que la web para mantener consistencia conceptual (aquí en AsyncStorage).
const STORAGE_KEY = "lb_cart";

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalMxn: number;
  groups: ReturnType<typeof groupByProvider>;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const hydrated = useRef(false);

  // Rehidratar desde AsyncStorage una vez al montar.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: CartItem[] = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length > 0) {
            dispatch({ type: "LOAD", items: saved });
          }
        }
      } catch {
        // storage corrupto — empezar limpio
      }
      hydrated.current = true;
    })();
  }, []);

  // Persistir en cada cambio, solo después de hidratar.
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {
      // sin espacio — ignorar
    });
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId });
  }, []);

  const updateQty = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", productId, quantity });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems: totalItems(items),
        totalMxn: totalMxn(items),
        groups: groupByProvider(items),
        addItem,
        removeItem,
        updateQty,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
