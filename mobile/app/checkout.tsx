import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart-context";
import { crearOrdenPendiente, ESTADOS_MX, type ShippingAddress } from "@/lib/orders";
import { colors } from "@/lib/theme";

const EMPTY: ShippingAddress = {
  nombre: "", telefono: "", calle: "", colonia: "", ciudad: "", estado: "", cp: "",
};

export default function Checkout() {
  const router = useRouter();
  const { session } = useAuth();
  const { items, groups, totalMxn, clear } = useCart();

  const [form, setForm] = useState<ShippingAddress>(EMPTY);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof ShippingAddress) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Sin sesión: el checkout requiere usuario autenticado (RLS de orders).
  if (!session) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="lock-closed-outline" size={44} color={colors.mute} />
        <Text style={styles.gateTitle}>Inicia sesión para comprar</Text>
        <Text style={styles.gateSub}>
          Necesitas una cuenta para completar tu pedido y ver tus compras.
        </Text>
        <Pressable style={styles.btnPrimary} onPress={() => router.push("/login")}>
          <Text style={styles.btnPrimaryText}>Iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.gateSub}>Tu carrito está vacío.</Text>
        <Pressable style={styles.btnPrimary} onPress={() => router.replace("/marketplace")}>
          <Text style={styles.btnPrimaryText}>Ir al marketplace</Text>
        </Pressable>
      </View>
    );
  }

  async function onConfirm() {
    setSubmitting(true);
    setError(null);
    const result = await crearOrdenPendiente(items, form);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    clear();
    router.replace("/pedido-exito");
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={styles.section}>Datos de envío</Text>

        <Field label="Nombre completo" value={form.nombre} onChange={set("nombre")} />
        <Field label="Teléfono" value={form.telefono} onChange={set("telefono")} keyboardType="phone-pad" />
        <Field label="Calle y número" value={form.calle} onChange={set("calle")} />
        <Field label="Colonia" value={form.colonia} onChange={set("colonia")} />
        <Field label="Ciudad" value={form.ciudad} onChange={set("ciudad")} />

        <View>
          <Text style={styles.label}>Estado</Text>
          <Pressable style={styles.select} onPress={() => setEstadoOpen(true)}>
            <Text style={form.estado ? styles.selectValue : styles.selectPlaceholder}>
              {form.estado || "Selecciona un estado"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.mute} />
          </Pressable>
        </View>

        <Field label="Código postal" value={form.cp} onChange={set("cp")} keyboardType="number-pad" />

        <View style={styles.divider} />
        <Text style={styles.section}>Resumen</Text>
        {groups.map((g) => (
          <View key={g.providerId} style={styles.summaryGroup}>
            <Text style={styles.summaryProvider}>{g.providerName}</Text>
            {g.items.map((i) => (
              <View key={i.productId} style={styles.summaryRow}>
                <Text style={styles.summaryItem} numberOfLines={1}>
                  {i.quantity}× {i.name}
                </Text>
                <Text style={styles.summaryPrice}>
                  ${(i.price * i.quantity).toLocaleString("es-MX")}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalMxn.toLocaleString("es-MX")} MXN</Text>
        </View>

        <Text style={styles.note}>
          El pago en línea (Mercado Pago) estará disponible pronto. Tu pedido queda
          registrado y el proveedor te contactará.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btnPrimary, submitting && styles.btnDisabled]}
          onPress={onConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.ink950} />
          ) : (
            <Text style={styles.btnPrimaryText}>Confirmar pedido</Text>
          )}
        </Pressable>
      </View>

      <Modal visible={estadoOpen} animationType="slide" transparent onRequestClose={() => setEstadoOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEstadoOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Selecciona tu estado</Text>
            <ScrollView>
              {ESTADOS_MX.map((e) => (
                <Pressable
                  key={e}
                  style={styles.modalOption}
                  onPress={() => {
                    set("estado")(e);
                    setEstadoOpen(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{e}</Text>
                  {form.estado === e && (
                    <Ionicons name="checkmark" size={18} color={colors.trail400} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: "default" | "phone-pad" | "number-pad";
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
        placeholderTextColor={colors.mute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink950 },
  center: { alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  gateTitle: { color: colors.bone, fontSize: 18, fontWeight: "700", marginTop: 4 },
  gateSub: { color: colors.mute, fontSize: 14, textAlign: "center" },
  section: { color: colors.bone, fontSize: 18, fontWeight: "800" },
  label: { color: colors.mute, fontSize: 13, marginBottom: 6 },
  input: {
    color: colors.bone,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.ink600,
    backgroundColor: colors.ink900,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.ink600,
    backgroundColor: colors.ink900,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectValue: { color: colors.bone, fontSize: 15 },
  selectPlaceholder: { color: colors.mute, fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.ink700, marginVertical: 4 },
  summaryGroup: { gap: 6 },
  summaryProvider: { color: colors.trail400, fontSize: 13, fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryItem: { color: colors.mute, fontSize: 14, flex: 1 },
  summaryPrice: { color: colors.bone, fontSize: 14, fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: { color: colors.bone, fontSize: 16, fontWeight: "600" },
  totalValue: { color: colors.trail400, fontSize: 20, fontWeight: "800" },
  note: { color: colors.mute, fontSize: 12, lineHeight: 18 },
  error: { color: colors.red, fontSize: 14 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink700,
    backgroundColor: colors.ink900,
    padding: 16,
  },
  btnPrimary: {
    backgroundColor: colors.trail500,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: colors.ink950, fontWeight: "700", fontSize: 15 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.ink900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: { color: colors.bone, fontSize: 16, fontWeight: "800", marginBottom: 12 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink800,
  },
  modalOptionText: { color: colors.bone, fontSize: 15 },
});
