// app/(tabs)/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectCliente from "../components/SelectCliente"; // ajuste se seu caminho for diferente
import {CLIENTES } from "../data/clients";
/************
 * CONFIG
 ************/
const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNG2qw7WJ5UxtLfA681FfAy4zk6mg4zrZOMWx15qUPQRvjHG1haZW2KyWCI756iyn-/exec"; // coloque sua URL /exec aqui

/************
 * UTILS
 ************/
const currency = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const toNumber = (v: any): number => {
  if (v === undefined || v === null) return 0;
  const s = String(v).replace(",", ".").replace(/[^\d\.\-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const hojeKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const STORAGE_KEY = `fechamento:${hojeKey()}`;

// Fixos
const ENTRADA_FIXOS_BASE = ["Moeda", "Tarifa", "Bolão", "Mkt", "Telesena"] as const;
// “Em caixa” entra por último (pedido)
const SAIDA_FIXOS = ["Moeda", "Bolão", "Mkt", "Troca"] as const;

type NameVal = { nome: string; valor: string };
type StateShape = {
  // IDENTIDADE
  auth?: { user: string; nome: string } | null;

  // ENTRADA
  entradaDinheiro: string[]; // dinâmico
  entradaFixos: Record<string, string>; // inclui os base e “Em caixa” (no fim)
  entradaRecebimentos: NameVal[]; // dinâmico (SelectCliente + valor)
  entradaMkt: string[]; // dinâmico
  entradaDenomQtds: { ["2.50"]?: string; ["5.00"]?: string; ["10.00"]?: string; ["20.00"]?: string };

  // SAÍDA
  saidaRetiradas: string[]; // dinâmico
  saidaFixos: Record<(typeof SAIDA_FIXOS)[number], string>;
  saidaPix: NameVal[]; // dinâmico (NOME LIVRE + valor)
  saidaFiados: NameVal[]; // dinâmico (SelectCliente + valor)
  saidaOutros: NameVal[]; // dinâmico (NOME LIVRE + valor)
  saidaRaspinhaValores: string[]; // raspinha na saída (apenas valores)
  saidaMkt: string[]; // dinâmico
};

const blankState = (): StateShape => ({
  auth: null,
  entradaDinheiro: [""],
  entradaFixos: {
    "Moeda": "",
    "Tarifa": "",
    "Bolão": "",
    "Mkt": "",
    "Telesena": "",
    "Em caixa": "", // aceita negativo, mas sem texto no label
  },
  entradaRecebimentos: [{ nome: "", valor: "" }],
  entradaMkt: [""],
  entradaDenomQtds: { "2.50": "0", "5.00": "0", "10.00": "0", "20.00": "0" },

  saidaRetiradas: [""],
  saidaFixos: {
    "Moeda": "",
    "Bolão": "",
    "Mkt": "",
    "Troca": "",
  },
  saidaPix: [{ nome: "", valor: "" }], // pix: nome livre + valor
  saidaFiados: [{ nome: "", valor: "" }], // fiado: SelectCliente + valor
  saidaOutros: [{ nome: "", valor: "" }], // outros: nome livre + valor
  saidaRaspinhaValores: [""],
  saidaMkt: [""],
});

/************
 * COMPONENTE
 ************/
export default function FechamentoScreen() {
  const [tab, setTab] = useState<"entrada" | "saida">("entrada");
  const [state, setState] = useState<StateShape>(blankState());
  const [loading, setLoading] = useState(true);

  // carrega auth e dados salvos do dia
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setState((p) => ({ ...p, ...parsed }));
        }
        const authStr = await AsyncStorage.getItem("auth:user");
        if (authStr) {
          try {
            const a = JSON.parse(authStr);
            if (a?.nome || a?.user) {
              setState((p) => ({ ...p, auth: { nome: a?.nome ?? "", user: a?.user ?? "" } }));
            }
          } catch {}
        }
      } catch (e) {
        console.warn("Erro lendo storage", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // soma de raspinhas (entrada) por denom
  const raspEntradaTotal = useMemo(() => {
    const d = state.entradaDenomQtds || {};
    return (
      toNumber(d["2.50"]) * 2.5 +
      toNumber(d["5.00"]) * 5 +
      toNumber(d["10.00"]) * 10 +
      toNumber(d["20.00"]) * 20
    );
  }, [state.entradaDenomQtds]);

  // totais
const totals = useMemo(() => {
  const sumArr = (arr?: string[]) => (Array.isArray(arr) ? arr.reduce((a, v) => a + toNumber(v), 0) : 0);
  const sumObj = (obj?: Record<string, string>) =>
    obj ? Object.values(obj).reduce((a, v) => a + toNumber(v), 0) : 0;
  const sumNameVal = (arr?: NameVal[]) =>
    Array.isArray(arr) ? arr.reduce((a, it) => a + toNumber(it?.valor), 0) : 0;

  // entradas negativas
  const entrada =
    -(sumArr(state.entradaDinheiro) +
      sumObj(state.entradaFixos) +
      sumArr(state.entradaMkt) +
      sumNameVal(state.entradaRecebimentos) +
      raspEntradaTotal);

  // saídas positivas
  const saida =
    sumArr(state.saidaRetiradas) +
    sumObj(state.saidaFixos) +
    sumArr(state.saidaMkt) +
    sumNameVal(state.saidaPix) +
    sumNameVal(state.saidaFiados) +
    sumNameVal(state.saidaOutros) +
    sumArr(state.saidaRaspinhaValores);

  // resultado = soma direta
  return { entrada, saida, resultado: entrada + saida };
}, [state, raspEntradaTotal]);


  /************
   * AÇÕES
   ************/
  async function salvarLocal() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      Alert.alert("Salvo!", "Dados salvos no dispositivo com sucesso.");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar no dispositivo.");
    }
  }

  function limparTudo() {
    Alert.alert("Limpar", "Deseja limpar todos os dados do dia?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: async () => {
          const fresh = blankState();
          fresh.auth = state.auth ?? null;
          setState(fresh);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  }

  async function enviarParaPlanilha() {
    Alert.alert(
      "Enviar para planilha",
      "Deseja enviar os dados do fechamento para a planilha?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          style: "default",
          onPress: async () => {
            try {
              let nome = state?.auth?.nome || "Caixa";
              let user = state?.auth?.user || "";

              const body = {
                nome,
                user,

                // entrada
                entradaDinheiro: state.entradaDinheiro,
                entradaFixos: state.entradaFixos,
                entradaMkt: state.entradaMkt,
                entradaRecebimentos: state.entradaRecebimentos,
                entradaDenomQtds: state.entradaDenomQtds,

                // saída
                saidaRetiradas: state.saidaRetiradas,
                saidaFixos: state.saidaFixos,
                saidaPix: state.saidaPix,
                saidaFiados: state.saidaFiados,
                saidaOutros: state.saidaOutros,
                saidaRaspinhaValores: state.saidaRaspinhaValores,
                saidaMkt: state.saidaMkt,
              };

              const res = await fetch(APPSCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });

              const json = await res.json().catch(() => ({} as any));
              if (!res.ok || !json?.ok) {
                throw new Error(json?.error || `HTTP ${res.status}`);
              }
              Alert.alert("Enviado!", "Dados enviados para a planilha com sucesso.");
            } catch (err: any) {
              console.error(err);
              Alert.alert("Erro", String(err?.message || err));
            }
          },
        },
      ]
    );
  }

  /************
   * RENDER
   ************/
  if (loading) return null;

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
        {/* Cabeçalho + Saudação */}
        <Text style={S.titulo}>Fechamento de Caixa • {hojeKey()}</Text>
        {state.auth?.nome ? (
          <Text style={S.greeting}>
            <Text style={{ fontStyle: "italic" }}>
              Olá, {state.auth.nome}, espero que você tenha um dia maravilhoso.
            </Text>{" "}
            <Text>❤️</Text>
          </Text>
        ) : null}

        {/* Abinhas de navegação (Entrada / Saída) */}
        <View style={S.tabs}>
          <Pressable
            onPress={() => setTab("entrada")}
            style={[S.tabBtn, tab === "entrada" ? S.tabBtnActive : null]}
          >
            <Text style={[S.tabTxt, tab === "entrada" ? S.tabTxtActive : null]}>Entrada</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("saida")}
            style={[S.tabBtn, tab === "saida" ? S.tabBtnActive : null]}
          >
            <Text style={[S.tabTxt, tab === "saida" ? S.tabTxtActive : null]}>Saída</Text>
          </Pressable>
        </View>

        {/* CARD DO FORM */}
        <View style={S.cardForm}>
          {tab === "entrada" ? renderEntrada() : renderSaida()}
        </View>

        {/* CARD DO RESUMO */}
        <View style={S.cardResumo}>
          <Text style={S.cardTitle}>Resumo</Text>
          <Row label="Total de Entrada" value={currency(totals.entrada)} />
          <Row label="Total de Saída" value={currency(totals.saida)} />
          <Row label="Resultado" value={currency(totals.resultado)} strong />
        </View>

        {/* Ações */}
<View style={S.actions}>
  <Pressable onPress={salvarLocal} style={[S.actionBtn, S.shadow]}>
    <MaterialCommunityIcons name="content-save-outline" size={18} color="#dd9aba" />
    <Text style={S.actionTxt}>Salvar</Text>
  </Pressable>

  <Pressable onPress={limparTudo} style={[S.actionBtn, S.shadow]}>
    <MaterialCommunityIcons name="broom" size={18} color="#dd9aba" />
    <Text style={S.actionTxt}>Limpar</Text>
  </Pressable>

  <Pressable onPress={enviarParaPlanilha} style={[S.actionBtn, S.shadow]}>
    <MaterialCommunityIcons name="send-outline" size={18} color="#dd9aba" />
    <Text style={S.actionTxt}>Enviar</Text>
  </Pressable>
</View>
      </ScrollView>
    </SafeAreaView>
  );

  /************
   * SUB-RENDERS
   ************/
  function renderEntrada() {
    // Ordem: Dinheiro, Moeda, Tarifa, Bolão, Mkt, Recebimento, Telesena, Raspinha, Em caixa (por último)
    return (
      <View>
        {/* Dinheiro (dinâmico) */}
        <Section
          title="Dinheiro"
           onAdd={() => setState(p => ({ ...p, entradaDinheiro: [...p.entradaDinheiro, ""] }))}
  onRemoveLast={() => setState(p => ({
    ...p,
    entradaDinheiro: p.entradaDinheiro.length > 1 ? p.entradaDinheiro.slice(0, -1) : p.entradaDinheiro
  }))}>
          <DynamicNumbers
            items={state.entradaDinheiro}
            onChange={(items) => setState((p) => ({ ...p, entradaDinheiro: items }))}
          />
        </Section>

        {/* Fixos na ordem desejada, exceto Em caixa que ficará por último */}
        {ENTRADA_FIXOS_BASE.map((k) => (
          <FixedInput
            key={k}
            label={k}
            value={state.entradaFixos[k] ?? ""}
            onChange={(v) =>
              setState((p) => ({ ...p, entradaFixos: { ...p.entradaFixos, [k]: v } }))
            }
          />
        ))}

        {/* Recebimento (dinâmico com SelectCliente) */}
        <Section
          title="Recebimento"
           onAdd={() => setState(p => ({ ...p, entradaRecebimentos: [...p.entradaRecebimentos, { nome: "", valor: "" }] }))}
  onRemoveLast={() => setState(p => ({
    ...p,
    entradaRecebimentos: p.entradaRecebimentos.length > 1 ? p.entradaRecebimentos.slice(0, -1) : p.entradaRecebimentos
  }))}
>
          <DynamicNameValWithPicker
    items={state.entradaRecebimentos}
    onChange={(items) => setState(p => ({ ...p, entradaRecebimentos: items }))}
    placeholderValor="0,00"
  />
</Section>

        {/* Telesena já foi mantido acima; agora Raspinha (Entrada) */}
        <Section title="Raspinha">
          <RaspinhasEntrada
            qtds={state.entradaDenomQtds}
            onChange={(qtds) => setState((p) => ({ ...p, entradaDenomQtds: qtds }))}
          />
          <View style={{ marginTop: 8, alignItems: "flex-end" }}>
            <Text style={{ fontWeight: "800", color: "#333" }}>
              Total Raspinha: {currency(raspEntradaTotal)}
            </Text>
          </View>
        </Section>

        {/* Em caixa por último */}
        <FixedInput
          label="Em caixa"
          value={state.entradaFixos["Em caixa"] ?? ""}
          onChange={(v) =>
            setState((p) => ({ ...p, entradaFixos: { ...p.entradaFixos, ["Em caixa"]: v } }))
          }
          allowNegative
        />
      </View>
    );
  }

  function renderSaida() {
    // Ordem: Retirada, Moeda, Bolão, Mkt, Pix, Fiado, Troca, Raspinha, Outros
    return (
      <View>
        {/* Retirada (dinâmico) */}
        <Section
          title="Retirada"
            onAdd={() => setState(p => ({ ...p, saidaRetiradas: [...p.saidaRetiradas, ""] }))}
  onRemoveLast={() => setState(p => ({
    ...p,
    saidaRetiradas: p.saidaRetiradas.length > 1 ? p.saidaRetiradas.slice(0, -1) : p.saidaRetiradas
  }))}
>
          <DynamicNumbers
            items={state.saidaRetiradas}
            onChange={(items) => setState((p) => ({ ...p, saidaRetiradas: items }))}
          />
        </Section>

        {/* Fixos: Moeda, Bolão, Mkt, Troca */}
        {SAIDA_FIXOS.map((k) => (
          <FixedInput
            key={k}
            label={k}
            value={state.saidaFixos[k] ?? ""}
            onChange={(v) =>
              setState((p) => ({ ...p, saidaFixos: { ...p.saidaFixos, [k]: v } }))
            }
          />
        ))}

        {/* Pix (dinâmico com NOME LIVRE + valor) — sem subtítulo, só placeholders */}
        <Section
          title="Pix"
           onAdd={() => setState(p => ({ ...p, saidaPix: [...p.saidaPix, { nome: "", valor: "" }] }))}
  onRemoveLast={() => setState(p => ({
    ...p,
    saidaPix: p.saidaPix.length > 1 ? p.saidaPix.slice(0, -1) : p.saidaPix
  }))}
>
          <DynamicNameValFree
            items={state.saidaPix}
            onChange={(items) => setState((p) => ({ ...p, saidaPix: items }))}
            placeholderNome="Nome"
            placeholderValor="0,00"
          />
        </Section>

        {/* Fiado (dinâmico com SelectCliente + valor) — sem subtítulo, só placeholders */}
        <Section
          title="Fiado"
           onAdd={() => setState(p => ({ ...p, saidaFiados: [...p.saidaFiados, { nome: "", valor: "" }] }))}
  onRemoveLast={() => setState(p => ({
    ...p,
    saidaFiados: p.saidaFiados.length > 1 ? p.saidaFiados.slice(0, -1) : p.saidaFiados
  }))}
>
          <DynamicNameValWithPicker
    items={state.saidaFiados}
    onChange={(items) => setState(p => ({ ...p, saidaFiados: items }))}
    placeholderValor="0,00"
  />
</Section>

        {/* Raspinha (Saída) — apenas valores (dinâmico) */}
        <Section
          title="Raspinha"
           onAdd={() => setState(p => ({ ...p, saidaRaspinhaValores: [...p.saidaRaspinhaValores, ""] }))}
  onRemoveLast={() => setState(p => ({
    ...p,
    saidaRaspinhaValores: p.saidaRaspinhaValores.length > 1 ? p.saidaRaspinhaValores.slice(0, -1) : p.saidaRaspinhaValores
  }))}
>
          <DynamicNumbers
            items={state.saidaRaspinhaValores}
            onChange={(items) => setState((p) => ({ ...p, saidaRaspinhaValores: items }))}
          />
        </Section>

        {/* Outros (dinâmico com NOME LIVRE + valor) — sem subtítulo, só placeholders */}
        <Section
          title="Outros"
           onAdd={() => setState(p => ({ ...p, saidaOutros: [...p.saidaOutros, { nome: "", valor: "" }] }))}
  onRemoveLast={() => setState(p => ({
    ...p,
    saidaOutros: p.saidaOutros.length > 1 ? p.saidaOutros.slice(0, -1) : p.saidaOutros
  }))}
>
          <DynamicNameValFree
            items={state.saidaOutros}
            onChange={(items) => setState((p) => ({ ...p, saidaOutros: items }))}
            placeholderNome="Nome"
            placeholderValor="0,00"
          />
        </Section>
      </View>
    );
  }
}

/************
 * SUBCOMPONENTES REUTILIZÁVEIS
 ************/
function Section({
  title,
  children,
  onAdd,
  onRemoveLast,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  onRemoveLast?: () => void;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>{title}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {onRemoveLast ? (
            <Pressable onPress={onRemoveLast} style={{padding: 4}} ><MaterialCommunityIcons name="minus-circle-outline" size={22} color="#dd9aba" />
          
            </Pressable>
          ) : null}
          {onAdd ? (
            <Pressable onPress={onAdd} style={{padding: 4}}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#dd9aba" />
            </Pressable>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={S.row}>
      <Text style={S.rowLabel}>{label}</Text>
      <Text style={[S.rowVal, strong ? { fontWeight: "900" } : null]}>{value}</Text>
    </View>
  );
}

/* Campo numérico fixo (linha única) */
function FixedInput({
  label,
  value,
  onChange,
  allowNegative,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowNegative?: boolean;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={S.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => {
          const ok = allowNegative ? /^-?\d*[.,]?\d*$/.test(t) : /^\d*[.,]?\d*$/.test(t);
          if (!ok) return;
          onChange(t);
        }}
        keyboardType="numeric"
        inputMode="decimal"
        placeholder="0,00"
        style={S.input}
      />
    </View>
  );
}

/* Item container com botão remover no canto superior direito */
function ItemCard({ children }: { children: React.ReactNode }) {
  return <View style={{ marginBottom: 8 }}>{children}</View>;
}

/* Lista dinâmica de números (ex.: Dinheiro, Retirada, Raspinha Saída) */
function DynamicNumbers({
  items,
  onChange,
}: {
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((v, i) => (
        <ItemCard key={i}>
          <TextInput
            value={v}
            onChangeText={(t) => {
              if (!/^-?\d*[.,]?\d*$/.test(t)) return;
              const next = [...items];
              next[i] = t;
              onChange(next);
            }}
            keyboardType="numeric"
            inputMode="decimal"
            placeholder="0,00"
            style={S.input}
          />
        </ItemCard>
      ))}
    </View>
  );
}

function DynamicNameValFree({
  items,
  onChange,
  placeholderNome,
  placeholderValor,
}: {
  items: { nome: string; valor: string }[];
  onChange: (next: { nome: string; valor: string }[]) => void;
  placeholderNome: string;
  placeholderValor: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((it, i) => (
        <ItemCard key={i}>
          <View style={S.inlineRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={it.nome}
                onChangeText={(nome) => {
                  const next = [...items];
                  next[i] = { ...next[i], nome };
                  onChange(next);
                }}
                placeholder={placeholderNome}
                style={S.input}
              />
            </View>
            <View style={{ width: 120 }}>
              <TextInput
                value={it.valor}
                onChangeText={(valor) => {
                  if (!/^\d*[.,]?\d*$/.test(valor)) return;
                  const next = [...items];
                  next[i] = { ...next[i], valor };
                  onChange(next);
                }}
                keyboardType="numeric"
                inputMode="decimal"
                placeholder={placeholderValor}
                style={S.input}
              />
            </View>
          </View>
        </ItemCard>
      ))}
    </View>
  );
}

function DynamicNameValWithPicker({
  items,
  onChange,
  placeholderValor,
}: {
  items: { nome: string; valor: string }[];
  onChange: (next: { nome: string; valor: string }[]) => void;
  placeholderValor: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((it, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",          // centraliza verticalmente
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {/* Coluna do SelectCliente */}
            <View style={{ width: "48%", alignItems: "stretch" }}>
              <SelectCliente
                value={it.nome}
                onChange={(nome) => {
                  const next = [...items];
                  next[i] = { ...next[i], nome };
                  onChange(next);
                }}
                inputStyle={{ height: 44 }}   // força mesma “altura de input”
              />
            </View>

            {/* Coluna do Valor */}
            <View style={{ width: "48%", alignItems: "stretch" }}>
              <TextInput
                value={it.valor}
                onChangeText={(valor) => {
                  if (!/^\d*[.,]?\d*$/.test(valor)) return;
                  const next = [...items];
                  next[i] = { ...next[i], valor };
                  onChange(next);
                }}
                keyboardType="numeric"
                inputMode="decimal"
                placeholder={placeholderValor}
                style={S.input}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
/* Raspinhas de ENTRADA – 2,50 / 5,00 / 10,00 / 20,00 (com + - e input de quantidade) */
function RaspinhasEntrada({
  qtds,
  onChange,
}: {
  qtds: StateShape["entradaDenomQtds"];
  onChange: (qtds: StateShape["entradaDenomQtds"]) => void;
}) {
  const DENOMS: { label: string; key: "2.50" | "5.00" | "10.00" | "20.00"; mult: number }[] = [
    { label: "2,50", key: "2.50", mult: 2.5 },
    { label: "5,00", key: "5.00", mult: 5 },
    { label: "10,00", key: "10.00", mult: 10 },
    { label: "20,00", key: "20.00", mult: 20 },
  ];

  const setQtd = (k: typeof DENOMS[number]["key"], q: string) =>
    onChange({ ...qtds, [k]: q });

  const inc = (k: typeof DENOMS[number]["key"]) =>
    onChange({ ...qtds, [k]: String((toNumber(qtds[k]) || 0) + 1) });

  const dec = (k: typeof DENOMS[number]["key"]) =>
    onChange({ ...qtds, [k]: String(Math.max(0, (toNumber(qtds[k]) || 0) - 1)) });

  return (
    <View style={{ gap: 8 }}>
      {DENOMS.map((d) => {
        const q = String(qtds[d.key] ?? "0");
        const total = toNumber(q) * d.mult;

        return (
          <View key={d.key} style={S.raspRow}>
            <Text style={S.raspLabel}>{d.label}</Text>

            <View style={S.raspControls}>
              <Pressable onPress={() => dec(d.key)} style={S.iconBtnSmall}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#655ad8" }}>－</Text>
              </Pressable>

              <TextInput
                value={q}
                onChangeText={(t) => {
                  if (!/^\d*$/.test(t)) return;
                  setQtd(d.key, t);
                }}
                keyboardType="numeric"
                inputMode="numeric"
                style={[S.input, { width: 80, textAlign: "center" }]}
              />

              <Pressable onPress={() => inc(d.key)} style={S.iconBtnSmall}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#655ad8" }}>＋</Text>
              </Pressable>
            </View>

            <Text style={S.raspTotal}>{currency(total)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/************
 * ESTILOS LOCAIS
 ************/
const S = {
  safe: {
    flex: 1,
    backgroundColor: "#ffdbd7",           // <— fundo
  },
  container: {
    padding: 16,
    gap: 14,
  } as any,
  titulo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#832d69",                      // <— texto principal
  } as any,
  greeting: {
    color: "#832d69",
    marginTop: 4,
    marginBottom: 8,
  } as any,

  tabs: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  } as any,
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#dd9aba",                // <— borda da aba
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  } as any,
   tabBtnActive: { backgroundColor: "#dd9aba" } as any,
   tabTxt: { fontWeight: "800", color: "#dd9aba" } as any,
  tabTxtActive: { color: "#fff" } as any,

  cardForm: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  } as any,
  cardResumo: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  } as any,
  cardTitle: { fontWeight: "900", color: "#333", marginBottom: 8 } as any,

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  } as any,
  sectionTitle: {
    fontWeight: "900",
    color: "#dd9aba",                      // <— títulos
    marginBottom: 8,
    fontSize: 16,
  } as any,

  label: {
    fontWeight: "800",
    color: "#dd9aba",                      // <— títulos dos campos fixos
    marginBottom: 6,
  } as any,

input: {
  width: "100%",
  backgroundColor: "#fff",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#dd9aba",
  paddingHorizontal: 12,
  paddingVertical: 10,
  height: 44,            // ⬅️ altura fixa p/ bater com o SelectCliente
  color: "#832d69",
  fontWeight: "700",
} as any,

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  } as any,
   rowLabel: { color: "#832d69" },
  rowVal:   { color: "#832d69", fontWeight: "800" } as any,

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  } as any,
  
  actionBtn: {
    flex: 1,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#dd9aba",                // <— borda botão
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",                  // <— para ícone + texto
    gap: 8,
  } as any,
  actionTxt: { color: "#dd9aba", fontWeight: "900" } as any,
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  } as any,

  // Raspinha entrada: linha “grudadinha”, + e - na mesma linha
  raspRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  } as any,
  raspLabel: { width: 64, fontWeight: "900", color: "#dd9aba", textAlign: "left" } as any,
  raspControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  } as any,
  raspTotal: {
    width: 120,
    textAlign: "right",
    fontWeight: "900",
    color: "#832d69",
  } as any,
iconBtnSmall: {
  width: 34,
  height: 34,
  borderRadius: 17,          // redondinho
  backgroundColor: "#fff",   // fundo branco
  borderWidth: 2,
  borderColor: "#dd9aba",    // rosa borda
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",       // sombra fofinha
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 3,              // sombra no Android
} as any,

  itemCard: {
    borderWidth: 1,
    borderColor: "#e7e8ec",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    position: "relative",
  } as any,
  itemRemoveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#dd9aba",                // <— borda do “–”
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  
  } as any,

  inlineRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  } as any,
};
