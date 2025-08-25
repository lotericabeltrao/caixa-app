// app/(tabs)/index.tsx
// Fix: Abas 'Entrada' e 'Saída' foram HOISTED para componentes de topo (fora do componente principal).
// Isso evita remount a cada render e corrige o bug de precisar clicar a cada caractere para digitar.
// Mantém: campos dinâmicos padronizados, raspinha com contador + input, rótulos coerentes e CSV/email.

import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, View, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MailComposer from "expo-mail-composer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { s } from "../../styles/shared";
import { sanitizeNumber as toNumber } from "../../components/ui/currency";

type NameValue = { nome: string; valor: string };
type UserInfo = { user: string; nome: string; email: string } | null;

const FIXO_EMAIL = "lotericabeltrao@gmail.com";

const DENOMS = [
  { key: "2.50", label: "2,50", value: 2.5 },
  { key: "5.00", label: "5,00", value: 5 },
  { key: "10.00", label: "10,00", value: 10 },
  { key: "20.00", label: "20,00", value: 20 },
] as const;

function hojeKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const STORAGE_KEY = "fechamento:" + hojeKey();
const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// State shape
type State = {
  entradaDinheiro: string[];
  entradaFixos: Record<string, string>;
  entradaRecebimentos: NameValue[];
  entradaDenomQtds: Record<"2.50"|"5.00"|"10.00"|"20.00", number>;
  saidaRetiradas: string[];
  saidaFixos: Record<string, string>;
  saidaPix: NameValue[];
  saidaFiados: NameValue[];
  saidaOutros: NameValue[];
  userInfo: UserInfo;
};

const blank = (): State => ({
  entradaDinheiro: [""],
  entradaFixos: { Moeda: "", Tarifa: "", "Bolão": "", Mkt: "", Telesena: "" },
  entradaRecebimentos: [{ nome: "", valor: "" }],
  entradaDenomQtds: { "2.50": 0, "5.00": 0, "10.00": 0, "20.00": 0 },
  saidaRetiradas: [""],
  saidaFixos: { Moeda: "", "Bolão": "", Mkt: "", Troca: "", Raspinha: "" },
  saidaPix: [{ nome: "", valor: "" }],
  saidaFiados: [{ nome: "", valor: "" }],
  saidaOutros: [{ nome: "", valor: "" }],
  userInfo: null,
});

function buildCsv(data: State) {
  const linhas: string[] = [];
  const dia = hojeKey();
  linhas.push(`Fechamento de Caixa;${dia}`);
  if (data?.userInfo) {
    linhas.push(`Caixa;${data.userInfo.nome} (${data.userInfo.user})`);
    linhas.push(`Email;${data.userInfo.email}`);
  }
  linhas.push("");

  // ENTRADA
  linhas.push("ENTRADA");
  (data.entradaDinheiro || []).forEach((v: string, i: number) => linhas.push(`Dinheiro ${i + 1};${toNumber(v).toFixed(2).replace(".", ",")}`));
  ["Moeda", "Tarifa", "Bolão", "Mkt", "Telesena"].forEach((k) => {
    const v = (data.entradaFixos || {})[k] || "";
    linhas.push(`${k};${toNumber(v).toFixed(2).replace(".", ",")}`);
  });
  DENOMS.forEach((d) => {
    const qtd = Number(data.entradaDenomQtds[d.key] || 0);
    const total = (qtd * d.value).toFixed(2).replace(".", ",");
    linhas.push(`Raspinha ${d.label} (qtd);${qtd}`);
    linhas.push(`Raspinha ${d.label} (total);${total}`);
  });
  (data.entradaRecebimentos || []).forEach((it: any, i: number) => {
    const label = it?.nome ? `Recebimento ${i + 1} - ${it.nome}` : `Recebimento ${i + 1}`;
    linhas.push(`${label};${toNumber(it?.valor).toFixed(2).replace(".", ",")}`);
  });

  // SAÍDA
  linhas.push("");
  linhas.push("SAÍDA");
  (data.saidaRetiradas || []).forEach((v: string, i: number) => linhas.push(`Retirada ${i + 1};${toNumber(v).toFixed(2).replace(".", ",")}`));
  ["Moeda", "Bolão", "Mkt", "Troca", "Raspinha"].forEach((k) => {
    const v = (data.saidaFixos || {})[k] || "";
    linhas.push(`${k};${toNumber(v).toFixed(2).replace(".", ",")}`);
  });
  (data.saidaPix || []).forEach((it: any, i: number) => {
    const label = it?.nome ? `Pix ${i + 1} - ${it.nome}` : `Pix ${i + 1}`;
    linhas.push(`${label};${toNumber(it?.valor).toFixed(2).replace(".", ",")}`);
  });
  (data.saidaFiados || []).forEach((it: any, i: number) => {
    const label = it?.nome ? `Fiado ${i + 1} - ${it.nome}` : `Fiado ${i + 1}`;
    linhas.push(`${label};${toNumber(it?.valor).toFixed(2).replace(".", ",")}`);
  });
  (data.saidaOutros || []).forEach((it: any, i: number) => {
    const label = it?.nome ? `Outros ${i + 1} - ${it.nome}` : `Outros ${i + 1}`;
    linhas.push(`${label};${toNumber(it?.valor).toFixed(2).replace(".", ",")}`);
  });

  // Totais
  const somaArr = (arr?: any[]) => (Array.isArray(arr) ? arr.reduce((a, v) => a + toNumber(v), 0) : 0);
  const somaObj = (obj?: Record<string, any>) => obj ? Object.values(obj).reduce((a, v) => a + toNumber(v), 0) : 0;
  const sumNameValue = (arr?: any[]) => Array.isArray(arr) ? arr.reduce((a, it) => a + toNumber(it?.valor), 0) : 0;
  const somaDenoms = DENOMS.reduce((acc, d) => acc + (Number((data?.entradaDenomQtds || {})[d.key]) || 0) * d.value, 0);
  const entrada = somaArr(data?.entradaDinheiro) + somaObj(data?.entradaFixos) + sumNameValue(data?.entradaRecebimentos) + somaDenoms;
  const saida = somaArr(data?.saidaRetiradas) + somaObj(data?.saidaFixos) + sumNameValue(data?.saidaPix) + sumNameValue(data?.saidaFiados) + sumNameValue(data?.saidaOutros);
  const resultado = entrada - saida;

  linhas.push("");
  linhas.push(`Total Entrada;${entrada.toFixed(2).replace(".", ",")}`);
  linhas.push(`Total Saída;${saida.toFixed(2).replace(".", ",")}`);
  linhas.push(`RESULTADO;${resultado.toFixed(2).replace(".", ",")}`);

  return linhas.join("\n");
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={[styles.fieldLabel]}>{children}</Text>;
}

function FieldMoney({ value, onChange, placeholder }: { value: string; onChange: (t: string) => void; placeholder?: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || "0,00"}
      keyboardType="numeric"
      style={styles.input}
      inputMode="decimal"
    />
  );
}

// Small UI helpers kept outside to be stable
function AddRemove({ onAdd, onRemove }: { onAdd: () => void; onRemove: () => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Pressable onPress={onRemove} style={styles.circleBtn}><Text style={styles.circleBtnText}>−</Text></Pressable>
      <Pressable onPress={onAdd} style={styles.circleBtn}><Text style={styles.circleBtnText}>+</Text></Pressable>
    </View>
  );
}

function NameValueList({
  arr,
  onChange,
}: {
  arr: NameValue[];
  onChange: (next: NameValue[]) => void;
}) {
  return (
    <View>
      {arr.map((it, idx) => (
        <View key={idx} style={styles.rowNV}>
          <TextInput
            value={it.nome}
            onChangeText={(t) => {
              const next = arr.slice();
              next[idx] = { ...it, nome: t.replace(/[\d]/g, "") };
              onChange(next);
            }}
            placeholder="Nome"
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            value={it.valor}
            onChangeText={(t) => {
              const next = arr.slice();
              next[idx] = { ...it, valor: t.replace(/[^\d,.-]/g, "") };
              onChange(next);
            }}
            placeholder="0,00"
            keyboardType="numeric"
            inputMode="decimal"
            style={[styles.input, { width: 130 }]}
          />
        </View>
      ))}
    </View>
  );
}

// ----- HOISTED TAB VIEWS (stable component identity) -----

type TabProps = {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
};

function EntradaView({ state, setState }: TabProps) {
  return (
    <View style={s.card}>
      <Text style={styles.sectionTitle}>Entrada</Text>

      {/* Dinheiro */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <Label>Dinheiro</Label>
          <AddRemove
            onAdd={() => setState((prev)=>({ ...prev, entradaDinheiro: [...prev.entradaDinheiro, ""] }))}
            onRemove={() => setState((prev)=>({ ...prev, entradaDinheiro: prev.entradaDinheiro.slice(0, -1) }))}
          />
        </View>
        {state.entradaDinheiro.map((v, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <FieldMoney value={v} onChange={(t) => {
              setState((prev)=>{
                const next = prev.entradaDinheiro.slice();
                next[i] = t.replace(/[^\d,.-]/g, "");
                return { ...prev, entradaDinheiro: next };
              });
            }} placeholder={`Dinheiro ${i + 1}`} />
          </View>
        ))}
      </View>

      {/* Fixos */}
      {["Moeda","Tarifa","Bolão","Mkt"].map((k) => (
        <View key={k} style={{ marginBottom: 12 }}>
          <Label>{k}</Label>
          <FieldMoney value={state.entradaFixos[k]} onChange={(t)=> setState((prev)=>({ ...prev, entradaFixos: { ...prev.entradaFixos, [k]: t.replace(/[^\d,.-]/g, "") } }))} />
        </View>
      ))}

      {/* Recebimento */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <Label>Recebimento</Label>
          <AddRemove
            onAdd={() => setState((prev)=>({ ...prev, entradaRecebimentos: [...prev.entradaRecebimentos, { nome: "", valor: "" }] }))}
            onRemove={() => setState((prev)=>({ ...prev, entradaRecebimentos: prev.entradaRecebimentos.slice(0, -1) }))}
          />
        </View>
        <NameValueList
          arr={state.entradaRecebimentos}
          onChange={(next)=>setState((prev)=>({ ...prev, entradaRecebimentos: next }))}
        />
      </View>

      {/* Telesena */}
      <View style={{ marginBottom: 12 }}>
        <Label>Telesena</Label>
        <FieldMoney value={state.entradaFixos["Telesena"]} onChange={(t)=> setState((prev)=>({ ...prev, entradaFixos: { ...prev.entradaFixos, Telesena: t.replace(/[^\d,.-]/g, "") } }))} />
      </View>

      {/* Raspinha */}
      <View style={{ marginBottom: 8 }}>
        <Label>Raspinha</Label>
        {DENOMS.map((d) => (
          <View key={d.key} style={[styles.counter, { alignItems: "center" }]}>
            <Text style={{ color: "#374151", fontWeight: "700", minWidth: 46 }}>{d.label}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => setState((prev)=>({ ...prev, entradaDenomQtds: { ...prev.entradaDenomQtds, [d.key]: Math.max(0, (prev.entradaDenomQtds[d.key]||0)-1) } }))} style={styles.circleBtn}><Text style={styles.circleBtnText}>−</Text></Pressable>
              <Text style={styles.counterQty}>{state.entradaDenomQtds[d.key]||0}</Text>
              <Pressable onPress={() => setState((prev)=>({ ...prev, entradaDenomQtds: { ...prev.entradaDenomQtds, [d.key]: (prev.entradaDenomQtds[d.key]||0)+1 } }))} style={styles.circleBtn}><Text style={styles.circleBtnText}>+</Text></Pressable>
            </View>
            <View style={{ width: 90 }}>
              <TextInput
                value={String(state.entradaDenomQtds[d.key] || 0)}
                onChangeText={(t) => {
                  const onlyDigits = t.replace(/[^\d]/g, "");
                  const val = onlyDigits === "" ? 0 : parseInt(onlyDigits, 10);
                  setState((prev)=>({ ...prev, entradaDenomQtds: { ...prev.entradaDenomQtds, [d.key]: isNaN(val) ? 0 : val } }));
                }}
                keyboardType="numeric"
                style={[styles.input, { paddingVertical: 8, textAlign: "center" }]}
                placeholder="Qtd"
              />
            </View>
          </View>
        ))}
      </View>

      {/* Total Entrada */}
      <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Entrada</Text><Text style={styles.totalValue}>{BRL(
        state.entradaDinheiro.reduce((a,v)=>a+toNumber(v),0) +
        Object.values(state.entradaFixos).reduce((a,v)=>a+toNumber(v),0) +
        state.entradaRecebimentos.reduce((a,it)=>a+toNumber(it.valor),0) +
        DENOMS.reduce((acc,d)=>acc+(state.entradaDenomQtds[d.key]||0)*d.value,0)
      )}</Text></View>
    </View>
  );
}

function SaidaView({ state, setState }: TabProps) {
  return (
    <View style={s.card}>
      <Text style={styles.sectionTitle}>Saída</Text>

      {/* Retirada */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <Label>Retirada</Label>
          <AddRemove
            onAdd={() => setState((prev)=>({ ...prev, saidaRetiradas: [...prev.saidaRetiradas, ""] }))}
            onRemove={() => setState((prev)=>({ ...prev, saidaRetiradas: prev.saidaRetiradas.slice(0, -1) }))}
          />
        </View>
        {state.saidaRetiradas.map((v, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <FieldMoney value={v} onChange={(t) => {
              setState((prev)=>{
                const next = prev.saidaRetiradas.slice();
                next[i] = t.replace(/[^\d,.-]/g, "");
                return { ...prev, saidaRetiradas: next };
              });
            }} placeholder={`Retirada ${i + 1}`} />
          </View>
        ))}
      </View>

      {/* Fixos */}
      {["Moeda","Bolão","Mkt"].map((k) => (
        <View key={k} style={{ marginBottom: 12 }}>
          <Label>{k}</Label>
          <FieldMoney value={state.saidaFixos[k]} onChange={(t)=> setState((prev)=>({ ...prev, saidaFixos: { ...prev.saidaFixos, [k]: t.replace(/[^\d,.-]/g, "") } }))} />
        </View>
      ))}

      {/* Pix */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <Label>Pix</Label>
          <AddRemove
            onAdd={() => setState((prev)=>({ ...prev, saidaPix: [...prev.saidaPix, { nome: "", valor: "" }] }))}
            onRemove={() => setState((prev)=>({ ...prev, saidaPix: prev.saidaPix.slice(0, -1) }))}
          />
        </View>
        <NameValueList
          arr={state.saidaPix}
          onChange={(next)=>setState((prev)=>({ ...prev, saidaPix: next }))}
        />
      </View>

      {/* Fiado */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <Label>Fiado</Label>
          <AddRemove
            onAdd={() => setState((prev)=>({ ...prev, saidaFiados: [...prev.saidaFiados, { nome: "", valor: "" }] }))}
            onRemove={() => setState((prev)=>({ ...prev, saidaFiados: prev.saidaFiados.slice(0, -1) }))}
          />
        </View>
        <NameValueList
          arr={state.saidaFiados}
          onChange={(next)=>setState((prev)=>({ ...prev, saidaFiados: next }))}
        />
      </View>

      {/* Troca */}
      <View style={{ marginBottom: 12 }}>
        <Label>Troca</Label>
        <FieldMoney value={state.saidaFixos["Troca"]} onChange={(t)=> setState((prev)=>({ ...prev, saidaFixos: { ...prev.saidaFixos, Troca: t.replace(/[^\d,.-]/g, "") } }))} />
      </View>

      {/* Raspinha fixo */}
      <View style={{ marginBottom: 12 }}>
        <Label>Raspinha</Label>
        <FieldMoney value={state.saidaFixos["Raspinha"]} onChange={(t)=> setState((prev)=>({ ...prev, saidaFixos: { ...prev.saidaFixos, Raspinha: t.replace(/[^\d,.-]/g, "") } }))} />
      </View>

      {/* Outros */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <Label>Outros</Label>
          <AddRemove
            onAdd={() => setState((prev)=>({ ...prev, saidaOutros: [...prev.saidaOutros, { nome: "", valor: "" }] }))}
            onRemove={() => setState((prev)=>({ ...prev, saidaOutros: prev.saidaOutros.slice(0, -1) }))}
          />
        </View>
        <NameValueList
          arr={state.saidaOutros}
          onChange={(next)=>setState((prev)=>({ ...prev, saidaOutros: next }))}
        />
      </View>

      {/* Total Saída */}
      <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Saída</Text><Text style={styles.totalValue}>{BRL(
        state.saidaRetiradas.reduce((a,v)=>a+toNumber(v),0) +
        Object.values(state.saidaFixos).reduce((a,v)=>a+toNumber(v),0) +
        state.saidaPix.reduce((a,it)=>a+toNumber(it.valor),0) +
        state.saidaFiados.reduce((a,it)=>a+toNumber(it.valor),0) +
        state.saidaOutros.reduce((a,it)=>a+toNumber(it.valor),0)
      )}</Text></View>
    </View>
  );
}

// ----- MAIN -----

export default function FechamentoScreen() {
  const [state, setState] = useState<State>(blank());
  const [tab, setTab] = useState<"entrada" | "saida">("entrada");

  useEffect(() => {
    (async () => {
      try { const saved = await AsyncStorage.getItem(STORAGE_KEY); if (saved) setState((s) => ({ ...s, ...JSON.parse(saved) })); } catch {}
      try { const auth = await AsyncStorage.getItem("auth:user"); if (auth) setState((s) => ({ ...s, userInfo: JSON.parse(auth) })); } catch {}
    })();
  }, []);

  const totals = useMemo(() => {
    const somaArr = (arr?: string[]) => (Array.isArray(arr) ? arr.reduce((a, v) => a + toNumber(v), 0) : 0);
    const somaNV = (arr?: NameValue[]) => (Array.isArray(arr) ? arr.reduce((a, it) => a + toNumber(it?.valor), 0) : 0);
    const somaObj = (obj?: Record<string, string>) => (obj ? Object.values(obj).reduce((a, v) => a + toNumber(v), 0) : 0);
    const somaDen = DENOMS.reduce((acc, d) => acc + (Number(state.entradaDenomQtds[d.key]) || 0) * d.value, 0);
    const entrada = somaArr(state.entradaDinheiro) + somaObj(state.entradaFixos) + somaNV(state.entradaRecebimentos) + somaDen;
    const saida = somaArr(state.saidaRetiradas) + somaObj(state.saidaFixos) + somaNV(state.saidaPix) + somaNV(state.saidaFiados) + somaNV(state.saidaOutros);
    return { entrada, saida, resultado: entrada - saida };
  }, [state]);

  async function salvarHoje() {
    try {
      const dataToSave = { ...state };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      const csv = buildCsv(dataToSave);
      const fileName = `fechamento_${hojeKey()}.csv`;

      const recipients = [state.userInfo?.email, FIXO_EMAIL].filter(Boolean) as string[];
      const assunto = `Fechamento de caixa - ${hojeKey()}`;

      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const corpo = `Segue o relatório em CSV (baixado no seu dispositivo).%0D%0A%0D%0AResumo:%0D%0A${csv.split("\n").slice(0, 30).join("%0D%0A")}`;
        window.location.href = `mailto:${recipients.join(",")}?subject=${encodeURIComponent(assunto)}&body=${corpo}`;

        Alert.alert("Salvo ✅", "Dados do dia salvos e CSV baixado.");
      } else {
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

        const isAvailable = await MailComposer.isAvailableAsync();
        if (isAvailable) {
          await MailComposer.composeAsync({
            recipients,
            subject: assunto,
            body: "Segue o relatório de fechamento do dia em anexo.\n\n",
            isHtml: false,
            attachments: [fileUri],
          });
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Ops", "Não foi possível compartilhar o CSV neste dispositivo.");
        }

        Alert.alert("Salvo ✅", "Dados do dia salvos. CSV gerado e envio iniciado.");
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar ou enviar o CSV.");
    }
  }

  function limparTudo() { setState(blank()); }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[s.container, { paddingBottom: 64 }]}>
          {/* Cabeçalho */}
          <View style={{ borderRadius: 22, overflow: "hidden", marginBottom: 8 }}>
            <LinearGradient colors={["#E9EDFF", "#FFF7F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="sparkles-outline" size={22} color="#7C83FD" />
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#27303F" }}>Fechamento de Caixa — {hojeKey()}</Text>
              </View>
              {!!state.userInfo?.nome && <Text style={{ color: "#6B7280", marginTop: 6 }}>Caixa: {state.userInfo?.nome}</Text>}
            </LinearGradient>
          </View>

          {/* Abas Entrada|Saída */}
          <View style={styles.tabsWrap}>
            <Pressable onPress={()=>setTab("entrada")} style={[styles.tabBtn, tab==="entrada" && styles.tabBtnActive]}>
              <Text style={[styles.tabText, tab==="entrada" && styles.tabTextActive]}>Entrada</Text>
            </Pressable>
            <Pressable onPress={()=>setTab("saida")} style={[styles.tabBtn, tab==="saida" && styles.tabBtnActive]}>
              <Text style={[styles.tabText, tab==="saida" && styles.tabTextActive]}>Saída</Text>
            </Pressable>
          </View>

          {tab === "entrada"
            ? <EntradaView state={state} setState={setState} />
            : <SaidaView state={state} setState={setState} />}

          {/* Resumo + Ações */}
          <View style={s.card}>
            <Text style={{ color: "#1F2A37", fontSize: 16, fontWeight: "800", marginBottom: 6 }}>Resumo</Text>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Entrada</Text><Text style={styles.totalValue}>{BRL(totals.entrada)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Saída</Text><Text style={styles.totalValue}>{BRL(totals.saida)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Resultado</Text><Text style={styles.totalValue}>{BRL(totals.resultado)}</Text></View>
            <View style={{ height: 12 }} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable style={[s.btn, s.btnSolid, { flex: 1, flexDirection: "row", gap: 8, borderRadius: 999 }]} onPress={salvarHoje}>
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                <Text style={s.btnText}>Salvar do dia (gera + envia CSV)</Text>
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

const styles = StyleSheet.create({
  sectionTitle: { color: "#111827", fontWeight: "800", fontSize: 18, marginBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  fieldLabel: { color: "#655ad8", fontWeight: "800", marginBottom: 6, fontSize: 16 },
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
  circleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#E9EDFF" },
  circleBtnText: { color: "#5D6BFF", fontSize: 18, fontWeight: "800", lineHeight: 18 },
  counter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderColor: "#E7EAF6", borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF", marginBottom: 8, gap: 12 },
  counterQty: { color: "#1F2A37", fontWeight: "800", width: 36, textAlign: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  totalLabel: { color: "#6B7280", fontWeight: "700" },
  totalValue: { color: "#111827", fontWeight: "800" },
  tabsWrap: {
    flexDirection: "row",
    backgroundColor: "#EEF1FF",
    padding: 6,
    borderRadius: 999,
    marginBottom: 12
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#655ad8"
  },
  tabText: { color: "#655ad8", fontWeight: "800" },
  tabTextActive: { color: "#fff", fontWeight: "800" },
});
