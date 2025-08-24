import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, View, Pressable, StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { s } from "../../styles/shared";
import { sanitizeNumber as toNumber } from "../../components/ui/currency";

function hojeKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const STORAGE_KEY = "fechamento:" + hojeKey();
const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type NameValue = { nome: string; valor: string };

const blank = () => ({
  entradaDinheiro: [""],
  entradaRecebimentos: [{ nome: "", valor: "" }] as NameValue[],
  entradaFixos: { Moeda: "", Tarifa: "", "Bolão": "", Mkt: "", Telesena: "" },
  entradaDenomQtds: { "2.50": 0, "5.00": 0, "10.00": 0, "20.00": 0 } as Record<"2.50"|"5.00"|"10.00"|"20.00", number>,

  saidaRetiradas: [""],
  saidaPix: [{ nome: "", valor: "" }] as NameValue[],
  saidaFiados: [{ nome: "", valor: "" }] as NameValue[],
  saidaOutros: [{ nome: "", valor: "" }] as NameValue[],
  saidaFixos: { Moeda: "", "Bolão": "", Mkt: "", Troca: "", Raspinha: "" },

  userInfo: null as null | { user: string; nome: string; email: string },
});

function Section({ title, right, children }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function MoneyInput({ label, value, onChangeText }: { label?: string; value: string; onChangeText: (t: string) => void; }) {
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^\d,.-]/g, ""))}
        keyboardType="numeric"
        placeholder="R$ 0,00"
        placeholderTextColor="#8B93AF"
        style={styles.input}
      />
    </View>
  );
}

function NameValueRow({ item, onChange, onRemove }: { item: NameValue; onChange: (it: NameValue) => void; onRemove?: () => void; }) {
  return (
    <View style={styles.rowNV}>
      <View style={{ flex: 1 }}>
        <Text style={s.fieldLabel}>Nome</Text>
        <TextInput
          style={[styles.input]}
          placeholder="Ex.: Cliente"
          placeholderTextColor="#8B93AF"
          value={item.nome}
          onChangeText={(t) => onChange({ ...item, nome: t.replace(/\d/g, "") })}
        />
      </View>
      <View style={{ width: 120 }}>
        <Text style={s.fieldLabel}>Valor</Text>
        <TextInput
          style={[styles.input]}
          placeholder="R$ 0,00"
          placeholderTextColor="#8B93AF"
          value={item.valor}
          onChangeText={(t) => onChange({ ...item, valor: t.replace(/[^\d,.-]/g, "") })}
          keyboardType="numeric"
        />
      </View>
      {onRemove ? (
        <Pressable onPress={async () => { await Haptics.selectionAsync(); onRemove(); }} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>−</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function QuickCounter({ label, qty, onInc, onDec, onAdd }:{ label: string; qty: number; onInc:()=>void; onDec:()=>void; onAdd?:(n:number)=>void; }) {
  const [tmp, setTmp] = useState("");
  return (
    <View style={styles.counter}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={async () => { await Haptics.selectionAsync(); onDec(); }}><Text style={styles.counterOp}>−</Text></Pressable>
        <Text style={styles.counterQty}>{qty}</Text>
        <Pressable onPress={async () => { await Haptics.selectionAsync(); onInc(); }}><Text style={styles.counterOp}>+</Text></Pressable>
      </View>
      {onAdd ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TextInput value={tmp} onChangeText={setTmp} placeholder="qtd" keyboardType="numeric" placeholderTextColor="#8B93AF" style={[styles.input, { width: 70, paddingVertical: 6 }]} />
          <Pressable onPress={async () => { const n = parseInt(tmp || "0", 10); if (!isNaN(n) && n > 0) { await Haptics.selectionAsync(); onAdd(n); setTmp(""); } }} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>+</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function FechamentoScreen() {
  const [state, setState] = useState(blank());

  useEffect(() => {
    (async () => {
      try { const saved = await AsyncStorage.getItem(STORAGE_KEY); if (saved) setState((s) => ({ ...s, ...JSON.parse(saved) })); } catch {}
      try { const auth = await AsyncStorage.getItem("auth:user"); if (auth) setState((s) => ({ ...s, userInfo: JSON.parse(auth) })); } catch {}
    })();
  }, []);

  const somaArr = (arr?: string[]) => (Array.isArray(arr) ? arr.reduce((a, v) => a + toNumber(v), 0) : 0);
  const somaNV = (arr?: NameValue[]) => (Array.isArray(arr) ? arr.reduce((a, it) => a + toNumber(it?.valor), 0) : 0);
  const somaObj = (obj?: Record<string, string>) => (obj ? Object.values(obj).reduce((a, v) => a + toNumber(v), 0) : 0);
  const somaDen = () => {
    const q = state.entradaDenomQtds;
    return (q["2.50"]||0)*2.5 + (q["5.00"]||0)*5 + (q["10.00"]||0)*10 + (q["20.00"]||0)*20;
  };

  const totals = useMemo(() => {
    const entrada = somaArr(state.entradaDinheiro) + somaObj(state.entradaFixos) + somaNV(state.entradaRecebimentos) + somaDen();
    const saida = somaArr(state.saidaRetiradas) + somaObj(state.saidaFixos) + somaNV(state.saidaPix) + somaNV(state.saidaFiados) + somaNV(state.saidaOutros);
    return { entrada, saida, resultado: entrada - saida };
  }, [state]);

  async function salvarHoje() {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); Alert.alert("Salvo 💾", "Fechamento do dia salvo no dispositivo."); }
    catch { Alert.alert("Erro", "Não foi possível salvar."); }
  }
  function limparTudo() { setState(blank()); }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[s.container, { paddingBottom: 40 }]}>
          <View style={{ borderRadius: 22, overflow: "hidden", marginBottom: 8 }}>
            <LinearGradient colors={["#E9EDFF", "#FFF7F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="sparkles-outline" size={22} color="#7C83FD" />
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#27303F" }}>Olá, {state.userInfo?.nome ?? "Caixa"} ✨</Text>
              </View>
              <Text style={{ color: "#6B7280", marginTop: 6 }}>Vamos fechar seu dia? 💖</Text>
            </LinearGradient>
          </View>

          <Text style={s.titulo}>Fechamento de Caixa ({hojeKey()})</Text>

          {/* ENTRADA */}
          <View style={s.card}>
            <Text style={{ color: "#111827", fontWeight: "800", fontSize: 18, marginBottom: 8 }}>Entrada 💸</Text>

            <Section
              title="Dinheiro"
              right={<Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, entradaDinheiro: [...p.entradaDinheiro, ""] })); }} style={styles.iconBtn}><Text style={styles.iconBtnText}>+</Text></Pressable>}
            >
              {state.entradaDinheiro.map((v, i) => (
                <View key={i} style={styles.rowNV}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Valor</Text>
                    <TextInput
                      style={[styles.input]}
                      placeholder="R$ 0,00" placeholderTextColor="#8B93AF" value={v}
                      onChangeText={(t) => setState((p) => { const arr = [...p.entradaDinheiro]; arr[i] = t.replace(/[^\d,.-]/g, ""); return { ...p, entradaDinheiro: arr }; })}
                      keyboardType="numeric"
                    />
                  </View>
                  {state.entradaDinheiro.length > 1 && (
                    <Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, entradaDinheiro: p.entradaDinheiro.filter((_, ix) => ix !== i) })); }} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>−</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </Section>

            {["Moeda", "Tarifa", "Bolão", "Mkt"].map((k) => (
              <MoneyInput key={k} label={k} value={state.entradaFixos[k as keyof typeof state.entradaFixos] || ""} onChangeText={(t) => setState((p) => ({ ...p, entradaFixos: { ...p.entradaFixos, [k]: t } }))} />
            ))}

            <Section
              title="Recebimento"
              right={<Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, entradaRecebimentos: [...p.entradaRecebimentos, { nome: "", valor: "" }] })); }} style={styles.iconBtn}><Text style={styles.iconBtnText}>+</Text></Pressable>}
            >
              {state.entradaRecebimentos.map((it, i) => (
                <NameValueRow
                  key={i}
                  item={it}
                  onChange={(novo) => setState((p) => { const arr = [...p.entradaRecebimentos]; arr[i] = novo; return { ...p, entradaRecebimentos: arr }; })}
                  onRemove={state.entradaRecebimentos.length > 1 ? async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, entradaRecebimentos: p.entradaRecebimentos.filter((_, ix) => ix !== i) })); } : undefined}
                />
              ))}
            </Section>

            <MoneyInput label="Telesena" value={state.entradaFixos["Telesena"] || ""} onChangeText={(t) => setState((p) => ({ ...p, entradaFixos: { ...p.entradaFixos, Telesena: t } }))} />

            <Text style={s.fieldLabel}>Raspinha</Text>
            <QuickCounter label="2,50" qty={state.entradaDenomQtds["2.50"]} onInc={() => setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"2.50":p.entradaDenomQtds["2.50"]+1} }))} onDec={()=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"2.50":Math.max(0,p.entradaDenomQtds["2.50"]-1)} }))} onAdd={(n)=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"2.50":p.entradaDenomQtds["2.50"]+n} }))} />
            <QuickCounter label="5,00"  qty={state.entradaDenomQtds["5.00"]} onInc={() => setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"5.00":p.entradaDenomQtds["5.00"]+1} }))} onDec={()=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"5.00":Math.max(0,p.entradaDenomQtds["5.00"]-1)} }))} onAdd={(n)=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"5.00":p.entradaDenomQtds["5.00"]+n} }))} />
            <QuickCounter label="10,00" qty={state.entradaDenomQtds["10.00"]} onInc={() => setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"10.00":p.entradaDenomQtds["10.00"]+1} }))} onDec={()=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"10.00":Math.max(0,p.entradaDenomQtds["10.00"]-1)} }))} onAdd={(n)=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"10.00":p.entradaDenomQtds["10.00"]+n} }))} />
            <QuickCounter label="20,00" qty={state.entradaDenomQtds["20.00"]} onInc={() => setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"20.00":p.entradaDenomQtds["20.00"]+1} }))} onDec={()=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"20.00":Math.max(0,p.entradaDenomQtds["20.00"]-1)} }))} onAdd={(n)=>setState((p)=>({ ...p, entradaDenomQtds:{...p.entradaDenomQtds,"20.00":p.entradaDenomQtds["20.00"]+n} }))} />

            <View style={{ marginTop: 8, alignItems: "flex-end" }}>
              <Text style={{ color: "#111827", fontWeight: "800" }}>Total Entrada: {BRL(totals.entrada)}</Text>
            </View>
          </View>

          {/* SAÍDA */}
          <View style={s.card}>
            <Text style={{ color: "#111827", fontWeight: "800", fontSize: 18, marginBottom: 8 }}>Saída 📤</Text>

            <Section
              title="Retirada"
              right={<Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaRetiradas: [...p.saidaRetiradas, ""] })); }} style={styles.iconBtn}><Text style={styles.iconBtnText}>+</Text></Pressable>}
            >
              {state.saidaRetiradas.map((v, i) => (
                <View key={i} style={styles.rowNV}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Valor</Text>
                    <TextInput
                      style={[styles.input]}
                      placeholder="R$ 0,00" placeholderTextColor="#8B93AF" value={v}
                      onChangeText={(t) => setState((p) => { const arr = [...p.saidaRetiradas]; arr[i] = t.replace(/[^\d,.-]/g, ""); return { ...p, saidaRetiradas: arr }; })}
                      keyboardType="numeric"
                    />
                  </View>
                  {state.saidaRetiradas.length > 1 && (
                    <Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaRetiradas: p.saidaRetiradas.filter((_, ix) => ix !== i) })); }} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>−</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </Section>

            {["Moeda", "Bolão", "Mkt"].map((k) => (
              <MoneyInput key={k} label={k} value={state.saidaFixos[k as keyof typeof state.saidaFixos] || ""} onChangeText={(t) => setState((p) => ({ ...p, saidaFixos: { ...p.saidaFixos, [k]: t } }))} />
            ))}

            <Section
              title="Pix"
              right={<Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaPix: [...p.saidaPix, { nome: "", valor: "" }] })); }} style={styles.iconBtn}><Text style={styles.iconBtnText}>+</Text></Pressable>}
            >
              {state.saidaPix.map((it, i) => (
                <NameValueRow
                  key={i}
                  item={it}
                  onChange={(novo) => setState((p) => { const arr = [...p.saidaPix]; arr[i] = novo; return { ...p, saidaPix: arr }; })}
                  onRemove={state.saidaPix.length > 1 ? async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaPix: p.saidaPix.filter((_, ix) => ix !== i) })); } : undefined}
                />
              ))}
            </Section>

            <Section
              title="Fiado"
              right={<Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaFiados: [...p.saidaFiados, { nome: "", valor: "" }] })); }} style={styles.iconBtn}><Text style={styles.iconBtnText}>+</Text></Pressable>}
            >
              {state.saidaFiados.map((it, i) => (
                <NameValueRow
                  key={i}
                  item={it}
                  onChange={(novo) => setState((p) => { const arr = [...p.saidaFiados]; arr[i] = novo; return { ...p, saidaFiados: arr }; })}
                  onRemove={state.saidaFiados.length > 1 ? async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaFiados: p.saidaFiados.filter((_, ix) => ix !== i) })); } : undefined}
                />
              ))}
            </Section>

            <MoneyInput label="Troca" value={state.saidaFixos["Troca"] || ""} onChangeText={(t) => setState((p) => ({ ...p, saidaFixos: { ...p.saidaFixos, Troca: t } }))} />
            <MoneyInput label="Raspinha" value={state.saidaFixos["Raspinha"] || ""} onChangeText={(t) => setState((p) => ({ ...p, saidaFixos: { ...p.saidaFixos, Raspinha: t } }))} />

            <Section
              title="Outros"
              right={<Pressable onPress={async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaOutros: [...p.saidaOutros, { nome: "", valor: "" }] })); }} style={styles.iconBtn}><Text style={styles.iconBtnText}>+</Text></Pressable>}
            >
              {state.saidaOutros.map((it, i) => (
                <NameValueRow
                  key={i}
                  item={it}
                  onChange={(novo) => setState((p) => { const arr = [...p.saidaOutros]; arr[i] = novo; return { ...p, saidaOutros: arr }; })}
                  onRemove={state.saidaOutros.length > 1 ? async () => { await Haptics.selectionAsync(); setState((p) => ({ ...p, saidaOutros: p.saidaOutros.filter((_, ix) => ix !== i) })); } : undefined}
                />
              ))}
            </Section>

            <View style={{ marginTop: 8, alignItems: "flex-end" }}>
              <Text style={{ color: "#111827", fontWeight: "800" }}>Total Saída: {BRL(totals.saida)}</Text>
            </View>
          </View>

          {/* RESUMO */}
          <View style={s.card}>
            <Text style={{ color: "#1F2A37", fontSize: 16, fontWeight: "800", marginBottom: 6 }}>Resumo 🧮</Text>
            <Row label="Total Entrada" value={BRL(totals.entrada)} />
            <Row label="Total Saída" value={BRL(totals.saida)} />
            <Row label="Resultado" value={BRL(totals.resultado)} strong />
            <View style={{ height: 12 }} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable style={[s.btn, s.btnSolid, { flex: 1, flexDirection: "row", gap: 8, borderRadius: 999 }]} onPress={salvarHoje}>
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                <Text style={s.btnText}>Salvar do dia</Text>
              </Pressable>
              <Pressable style={[s.btn, { flex: 1, borderWidth: 1, borderColor: "#E7EAF6", backgroundColor: "#FFFFFF", borderRadius: 999, flexDirection: "row", gap: 8 }]} onPress={limparTudo}>
                <MaterialCommunityIcons name="broom" size={18} color="#7C83FD" />
                <Text style={{ color: "#7C83FD", fontWeight: "800" }}>Limpar</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#EEF1F7" }}>
      <Text style={{ color: "#6B7280" }}>{label}</Text>
      <Text style={{ color: "#111827", fontWeight: strong ? "800" : "700" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  sectionTitle: { color: "#374151", fontWeight: "800", fontSize: 16 },
  input: {
    backgroundColor: "#FAFBFF",
    borderColor: "#E7EAF6",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#1F2A37",
  },
  rowNV: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
  counter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderColor: "#E7EAF6", borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF", marginBottom: 8,
  },
  counterOp: { color: "#5D6BFF", fontSize: 24, width: 28, textAlign: "center" },
  counterQty: { color: "#1F2A37", fontWeight: "800", width: 36, textAlign: "center" },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#E9EDFF" },
  iconBtnText: { color: "#5D6BFF", fontSize: 18, fontWeight: "800", lineHeight: 18 },
});
