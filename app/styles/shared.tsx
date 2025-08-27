
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  Animated,
  Easing,
} from "react-native";

/* ===================== HELPERS VISUAIS ===================== */

function getShadow(elevation = 6): ViewStyle {
  // Sombras suaves cross-platform (Web usa boxShadow, iOS/Android usam elevation+shadow*)
  const web: ViewStyle =
    Platform.OS === "web"
      ? { boxShadow: "0 6px 20px rgba(101, 90, 216, 0.15)" }
      : {};
  return {
    ...web,
    elevation,
    shadowColor: "#655ad8",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  };
}

const R = 20; // raio padrão fofinho
const PAD = 14;
  /* ===================== BOTÕES PRINCIPAIS (FOFOS) ===================== */

export function MainButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: "blue" | "red" | "purple";
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();

  const bg =
    color === "blue"
      ? "#3B82F6"
      : color === "red"
      ? "#EF4444"
      : "#655ad8";

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[
          {
            backgroundColor: bg,
            borderRadius: 999,
            paddingVertical: 14,
            paddingHorizontal: 28,
            marginHorizontal: 4,
            alignItems: "center",
            justifyContent: "center",
            ...getShadow(3),
          },
        ]}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
/* ===================== ESTILOS GERAIS ===================== */
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  container: { padding: 16, gap: 12 },

  /* Cartões / caixas */
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF6",
    borderRadius: R + 2,
    padding: PAD,
    marginBottom: 12,
    ...getShadow(4),
  },

  /* Abas */
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginHorizontal: 6,
    backgroundColor: "#EEF1FF",
  },
  tabBtnActive: {
    backgroundColor: "#655ad8",
  },
  tabText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  /* Inputs / labels */
  fieldLabel: {
    color: "#655ad8",
    fontWeight: "800",
    marginBottom: 6,
    fontSize: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EAF6",
    borderWidth: 1,
    borderRadius: R,
    paddingHorizontal: PAD,
    paddingVertical: 12,
    color: "#1F2A37",
    ...getShadow(1),
  },
  inputFocused: {
    borderColor: "#655ad8",
    shadowColor: "#655ad8",
    shadowOpacity: 0.18,
    elevation: 3,
  },

  /* Botões */
  btn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF6",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    ...getShadow(2),
  },
  btnSolid: {
    backgroundColor: "#655ad8",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    ...getShadow(3),
  },
  btnText: {
    color: "#655ad8",
    fontWeight: "800",
  },

  /* Controles auxiliares */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF1FF",
    ...getShadow(1),
  },
  circleBtnText: { color: "#5D6BFF", fontSize: 18, fontWeight: "800", lineHeight: 18 },

  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  totalLabel: { color: "#6B7280", fontWeight: "700" },
  totalValue: { color: "#111827", fontWeight: "800" },
});

/* ===================== COMPONENTES BÁSICOS ===================== */

export function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}) {
  return <Text style={[styles.fieldLabel, style]}>{children}</Text>;
}

export function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

export function AddRemove({ onAdd, onRemove }: { onAdd: () => void; onRemove: () => void }) {
  const scaleMinus = useRef(new Animated.Value(1)).current;
  const scalePlus = useRef(new Animated.Value(1)).current;

  const pressIn = (v: Animated.Value) =>
    Animated.spring(v, { toValue: 0.92, useNativeDriver: true, friction: 6, tension: 120 }).start();
  const pressOut = (v: Animated.Value) =>
    Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }).start();

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Animated.View style={{ transform: [{ scale: scaleMinus }] }}>
        <Pressable
          onPressIn={() => pressIn(scaleMinus)}
          onPressOut={() => pressOut(scaleMinus)}
          onPress={onRemove}
          hitSlop={8}
          style={styles.circleBtn}
        >
          <Text style={styles.circleBtnText}>−</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: scalePlus }] }}>
        <Pressable
          onPressIn={() => pressIn(scalePlus)}
          onPressOut={() => pressOut(scalePlus)}
          onPress={onAdd}
          hitSlop={8}
          style={styles.circleBtn}
        >
          <Text style={styles.circleBtnText}>+</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/* ===================== ENTRADAS NUMÉRICAS ===================== */

function onlyNumber(s: string) {
  return s.replace(/[^\d,.-]/g, "");
}

function FocusableInput({
  value,
  onChangeText,
  placeholder,
  style,
  keyboardType = "default",
  inputMode,
  autoCapitalize,
  autoCorrect,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  style?: ViewStyle | ViewStyle[];
  keyboardType?: any;
  inputMode?: any;
  autoCapitalize?: any;
  autoCorrect?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
      inputMode={inputMode}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      selectionColor="#655ad8"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.input, focused && styles.inputFocused, style]}
    />
  );
}

/** Campo fixo de dinheiro (com label acima) */
export function FixedInput({
  label,
  value,
  onChange,
  containerStyle,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  containerStyle?: ViewStyle;
}) {
  return (
    <View style={[{ marginBottom: 12 }, containerStyle]}>
      <Label>{label}</Label>
      <FocusableInput
        value={value}
        onChangeText={(t) => onChange(onlyNumber(t))}
        placeholder="0,00"
        keyboardType="numeric"
        inputMode="decimal"
      />
    </View>
  );
}

/** Lista dinâmica de valores numéricos (um abaixo do outro) */
/** Lista dinâmica com rótulo + botões +/− no cabeçalho */
export function DynamicList({
  label,
  arr,
  onChange,
  placeholder = "Valor",
  itemLabel,
}: {
  label: string;
  arr: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** opcional: rotular cada linha no placeholder (ex.: "Dinheiro 1") */
  itemLabel?: (idx: number) => string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={styles.headerRow}>
        <Label>{label}</Label>
        <AddRemove
          onAdd={() => onChange([...arr, ""])}
          onRemove={() => onChange(arr.length > 1 ? arr.slice(0, -1) : arr)}
        />
      </View>

      {arr.map((v, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <FocusableInput
            value={v}
            onChangeText={(t) => {
              const next = arr.slice();
              next[i] = onlyNumber(t);
              onChange(next);
            }}
            placeholder={itemLabel ? itemLabel(i) : `${placeholder} ${i + 1}`}
            keyboardType="numeric"
          />
        </View>
      ))}
    </View>
  );
}

/* ===================== NOME + VALOR (LADO A LADO) ===================== */

/** Nome livre + Valor (lado a lado). Usado em Pix/Outros. */
export function NameValueList({
  arr,
  onChange,
  placeholderNome = "Nome",
}: {
  arr: { nome: string; valor: string }[];
  onChange: (next: { nome: string; valor: string }[]) => void;
  placeholderNome?: string;
}) {
  return (
    <View>
      {arr.map((it, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {/* Nome (texto) */}
          <FocusableInput
            value={it.nome}
            onChangeText={(t) => {
              const next = arr.slice();
              // Se quiser permitir números no nome, troque para: next[idx] = { ...it, nome: t };
              next[idx] = { ...it, nome: t.replace(/\d/g, "") };
              onChange(next);
            }}
            placeholder={placeholderNome}
            autoCapitalize="words"
            autoCorrect={false}
            style={{ flex: 1 }}
          />
          {/* Valor (numérico) */}
          <FocusableInput
            value={it.valor}
            onChangeText={(t) => {
              const next = arr.slice();
              next[idx] = { ...it, valor: onlyNumber(t) };
              onChange(next);
            }}
            placeholder="0,00"
            keyboardType="numeric"
            inputMode="decimal"
            style={{ width: 130 }}
          />
        </View>
      ))}
    </View>
  );
}
/*=============

/* ===================== RASPINHA (ENTRADA) POR DENOMINAÇÕES ===================== */

const DENOMS = [
  { key: "2.50", label: "2,50", value: 2.5 },
  { key: "5.00",  label: "5,00", value: 5 },
  { key: "10.00", label: "10,00", value: 10 },
  { key: "20.00", label: "20,00", value: 20 },
] as const;

export type RaspinhaQtds = Record<"2.50" | "5.00" | "10.00" | "20.00", number>;

export function RaspinhaControl({
  qtds,
  onChange,
}: {
  qtds: RaspinhaQtds;
  onChange: (next: RaspinhaQtds) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Label>Raspinha</Label>
      {DENOMS.map((d) => (
        <View
          key={d.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderColor: "#E7EAF6",
            borderWidth: 1,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: "#FFFFFF",
            marginBottom: 8,
            gap: 12,
            ...getShadow(1),
          }}
        >
          <Text style={{ color: "#374151", fontWeight: "700", minWidth: 46 }}>{d.label}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={() =>
                onChange({
                  ...qtds,
                  [d.key]: Math.max(0, (qtds[d.key] || 0) - 1),
                })
              }
              style={styles.circleBtn}
            >
              <Text style={styles.circleBtnText}>−</Text>
            </Pressable>

            <FocusableInput
              value={String(qtds[d.key] || 0)}
              onChangeText={(t) => {
                const onlyDigits = t.replace(/[^\d]/g, "");
                const val = onlyDigits === "" ? 0 : parseInt(onlyDigits, 10);
                onChange({ ...qtds, [d.key]: isNaN(val) ? 0 : val });
              }}
              placeholder="Qtd"
              keyboardType="numeric"
              style={{ width: 80, textAlign: "center" } as any}
            />

            <Pressable
              onPress={() =>
                onChange({
                  ...qtds,
                  [d.key]: (qtds[d.key] || 0) + 1,
                })
              }
              style={styles.circleBtn}
            >
              <Text style={styles.circleBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
/* ===================== SELECT (BUSCA) + VALOR ===================== */

/**
 * SelectNVList — Mostra um "select" de nomes (com busca) + valor numérico na MESMA LINHA.
 * - options: { id, nome } (lista de clientes)
 * - arr: itens { clienteId?, nome, valor }
 * Animação fofinha no modal (fade/scale).
 */
export function SelectNVList({
  arr,
  onChange,
  options,
  placeholder = "Selecionar...",
}: {
  arr: { clienteId?: string; nome: string; valor: string }[];
  onChange: (next: { clienteId?: string; nome: string; valor: string }[]) => void;
  options: { id: string; nome: string }[];
  placeholder?: string;
}) {
  const [modalOpenIdx, setModalOpenIdx] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((c) => c.nome.toLowerCase().includes(q));
  }, [query, options]);

  // animação do modal
  const anim = useRef(new Animated.Value(0)).current;
  const visible = modalOpenIdx !== null;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const opacity = anim;

  return (
    <View>
      {arr.map((it, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {/* Seleção de Nome (abre modal) */}
          <Pressable
            onPress={() => {
              setModalOpenIdx(idx);
              setQuery("");
            }}
            style={[styles.input, { flex: 1, justifyContent: "center", paddingVertical: 14 }]}
          >
            <Text style={{ color: it.nome ? "#1F2A37" : "#9CA3AF" }}>
              {it.nome || placeholder}
            </Text>
          </Pressable>

          {/* Valor numérico */}
          <FocusableInput
            value={it.valor}
            onChangeText={(t) => {
              const next = arr.slice();
              next[idx] = { ...it, valor: onlyNumber(t) };
              onChange(next);
            }}
            placeholder="0,00"
            keyboardType="numeric"
            inputMode="decimal"
            style={{ width: 130 }}
          />

          {/* Modal de busca (exibe SOMENTE o nome) */}
          <Modal
            visible={modalOpenIdx === idx}
            transparent
            animationType="none"
            onRequestClose={() => setModalOpenIdx(null)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.35)",
                justifyContent: "center",
                alignItems: "center",
                padding: 24,
              }}
            >
              <Animated.View
                style={{
                  width: "100%",
                  maxWidth: 480,
                  backgroundColor: "#fff",
                  borderRadius: R + 4,
                  padding: 12,
                  opacity,
                  transform: [{ scale }],
                  ...getShadow(8),
                }}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    color: "#111827",
                    fontSize: 16,
                    marginBottom: 8,
                  }}
                >
                  Selecionar
                </Text>

                <FocusableInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar por nome..."
                  autoCapitalize="none"
                  style={{ marginBottom: 8 }}
                />

                <ScrollView style={{ maxHeight: 320 }}>
                  {filtered.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        const next = arr.slice();
                        next[idx] = { ...it, clienteId: c.id, nome: c.nome };
                        onChange(next);
                        setModalOpenIdx(null);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6",
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ fontWeight: "700", color: "#111827" }}>{c.nome}</Text>
                    </Pressable>
                  ))}
                  {!filtered.length && (
                    <Text style={{ color: "#6B7280", padding: 10 }}>Nenhum encontrado</Text>
                  )}
                </ScrollView>

                <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                  <Pressable
                    onPress={() => setModalOpenIdx(null)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      backgroundColor: "#EEF1FF",
                    }}
                  >
                    <Text style={{ color: "#655ad8", fontWeight: "800" }}>Fechar</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </Modal>
        </View>
      ))}
      
    </View>
  );


}
