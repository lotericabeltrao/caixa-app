import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from "react-native";

/** Ajuste se usar Apps Script */
const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbzjcFjoIAp3DrSCHF_NNFsFDtokDNTlMk3Ql_Ayp8wUq0NixFLUGady7F3RsMuAjRIi/exec";
const STORAGE_KEY = "";

/** Lista fixa de clientes (fiado/recebimento) */
const CLIENTES = [
  "Mamão","Galante","Colaço","Eugênio","Lô","José XCAP","Irineu","Adilson","Antônio Ribeiro","Josué",
  "Paulo Borges","Jacqueline","Pai","Lucas","Adriana","Shirley","Jair","Sonia P","Paião","Cardoso",
  "Volante","Machado","Henrique","Giva","Polato","Peletiero","Minha Grife","Instaladora Andrade",
];

const C = { bg: "#ffdbd7", accent: "#dd9abaff", textDark: "#832d69ff", white: "#ffffff", border: "#dd9abaff" };

/** helpers */
const toNumber = (v: any) =>
  typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
const currency = (n: number) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Sanitiza texto para numérico (mantém vazio) */
function sanitizeNumText(t: string) {
  if (t.trim() === "") return "";
  const cleaned = t.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
  return normalized;
}

/** Estilos */
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 16 },

  titulo: { fontSize: 22, fontWeight: "900", color: C.accent, marginBottom: 8 },

  greetRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  greetText: { fontStyle: "italic", color: C.textDark, fontWeight: "600", marginRight: 6 },

  tabsRow: { flexDirection: "row", marginBottom: 12 },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.white, // fundo branco mesmo inativa
    ...(Platform.OS === "web" ? { boxShadow: "0 3px 8px rgba(0,0,0,0.06)" as any } : { elevation: 2 }),
  },
  tabBtnActive: { backgroundColor: C.accent },
  tabText: { color: C.accent, fontWeight: "900" },
  tabTextActive: { color: "#fff", fontWeight: "900" },

  label: { fontWeight: "800", color: C.accent, marginBottom: 6 },

  input: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 8 : 10,
    marginBottom: 12,
    color: C.textDark,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  inputCompact: {
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "web" ? 6 : 8,
    marginBottom: 6,
  },

  // Cards (formulário e resumo)
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 10px rgba(0,0,0,0.08)" as any }
      : { elevation: 3 }),
  },
  cardSmall: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 10px rgba(0,0,0,0.10)" as any }
      : { elevation: 2 }),
  },

  sectionHeader: {
    color: C.accent,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 8,
  },

  groupCard: { backgroundColor: "transparent", borderWidth: 0, borderRadius: 0, marginBottom: 10, padding: 0 },
  groupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  groupTitle: { color: C.accent, fontWeight: "900", fontSize: 16 },
  groupBtns: { flexDirection: "row" },

  smallBtn: {
    width: 30, height: 30, borderWidth: 0, borderColor: "transparent", borderRadius: 15,
    backgroundColor: "transparent", alignItems: "center", justifyContent: "center", marginHorizontal: 6,
  },

  row2: { flexDirection: "row" },
  col: { flex: 1, marginRight: 10 },
  colLast: { flex: 1 },

  actionButtonsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 16, marginBottom: 28 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.white, // fundo branco
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 10px rgba(0,0,0,0.12)" as any }
      : { elevation: 4 }),
  },
  actionButtonText: { color: C.accent, fontWeight: "800", fontSize: 16 },

  resumoRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  resumoLabel: { color: C.textDark, fontWeight: "800" },
  resumoValor: { color: C.textDark, fontWeight: "900" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: C.white, borderRadius: 10, padding: 12, maxHeight: "70%" },
  searchInput: {
    alignSelf: "stretch", backgroundColor: "#fff", borderRadius: 10, borderWidth: 2, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, color: C.textDark, fontWeight: "700" as TextStyle["fontWeight"],
  },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  chipText: { color: C.textDark, fontWeight: "800" as TextStyle["fontWeight"] },

  nameBox: {
    flex: 1, borderWidth: 2, borderColor: C.border, borderRadius: 10, backgroundColor: C.white,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, justifyContent: "center",
  },
  nameBoxText: { color: C.textDark, fontWeight: "800" as TextStyle["fontWeight"] },
  nameBoxPlaceholder: { color: "#9c6e82", fontWeight: "700" as TextStyle["fontWeight"] },
});

type NameValue = { nome?: string; valor?: string };

export default function FechamentoScreen() {
  const [sec, setSec] = useState<"entrada" | "saida">("entrada");
  const [userInfo, setUserInfo] = useState<{ nome?: string } | null>(null);

  // ENTRADA
  const [dinheiro, setDinheiro] = useState<string[]>([""]);
  const [moedaEntrada, setMoedaEntrada] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [bolaoEntrada, setBolaoEntrada] = useState("");
  const [mktEntrada, setMktEntrada] = useState<string[]>([""]);
  const [recebimentos, setRecebimentos] = useState<NameValue[]>([{ nome: "", valor: "" }]);
  const [telesena, setTelesena] = useState("");
  const [raspQtd, setRaspQtd] = useState({ "2.50": "0", "5.00": "0", "10.00": "0", "20.00": "0" });
  const [emCaixa, setEmCaixa] = useState("");

  // SAÍDA
  const [retiradas, setRetiradas] = useState<string[]>([""]);
  const [moedaSaida, setMoedaSaida] = useState("");
  const [bolaoSaida, setBolaoSaida] = useState("");
  const [mktSaida, setMktSaida] = useState<string[]>([""]);
  const [pix, setPix] = useState<NameValue[]>([{ nome: "", valor: "" }]);     // livre nome + valor
  const [fiado, setFiado] = useState<NameValue[]>([{ nome: "", valor: "" }]); // seletor + valor numérico
  const [troca, setTroca] = useState("");
  const [raspSaida, setRaspSaida] = useState<string[]>([""]);                 // apenas valor
  const [outros, setOutros] = useState<NameValue[]>([{ nome: "", valor: "" }]);

  // Modal seletor de clientes (para Recebimento e Fiado — Pix não usa)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTarget, setPickerTarget] = useState<{ kind: "receb" | "fiado"; index: number } | null>(null);

  const filteredClientes = CLIENTES.filter((n) =>
    n.toLowerCase().includes(pickerSearch.trim().toLowerCase())
  );
  const openPicker = (kind: "receb" | "fiado", index: number) => {
    setPickerTarget({ kind, index }); setPickerSearch(""); setPickerOpen(true);
  };
  const chooseClient = (nome: string) => {
    if (!pickerTarget) return;
    if (pickerTarget.kind === "receb") {
      setRecebimentos((p) => p.map((x, i) => (i === pickerTarget.index ? { ...x, nome } : x)));
    } else {
      setFiado((p) => p.map((x, i) => (i === pickerTarget.index ? { ...x, nome } : x)));
    }
    setPickerOpen(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const auth = await AsyncStorage.getItem("auth:user");
        if (auth) setUserInfo(JSON.parse(auth));
      } catch {}
    })();
  }, []);

  const totais = useMemo(() => {
    const somaArr = (arr: string[]) => arr.reduce((a, v) => a + toNumber(v), 0);
    const somaNV = (arr: NameValue[]) => arr.reduce((a, it) => a + toNumber(it.valor), 0);

    const raspEntradaTotal =
      toNumber(raspQtd["2.50"]) * 2.5 +
      toNumber(raspQtd["5.00"]) * 5 +
      toNumber(raspQtd["10.00"]) * 10 +
      toNumber(raspQtd["20.00"]) * 20;

    const entrada =
      somaArr(dinheiro) +
      toNumber(moedaEntrada) +
      toNumber(tarifa) +
      toNumber(bolaoEntrada) +
      somaArr(mktEntrada) +
      toNumber(telesena) +
      raspEntradaTotal +
      toNumber(emCaixa);

    const saida =
      somaArr(retiradas) +
      toNumber(moedaSaida) +
      toNumber(bolaoSaida) +
      somaArr(mktSaida) +
      somaNV(pix) +
      somaNV(fiado) +
      toNumber(troca) +
      somaArr(raspSaida) +
      somaNV(outros);

    return {
      entrada,
      saida,
      resultado: entrada - saida,
      raspEntradaTotal,
      subtotalEntrada: entrada,
      subtotalSaida: saida,
    };
  }, [
    dinheiro, moedaEntrada, tarifa, bolaoEntrada, mktEntrada, telesena, raspQtd, emCaixa,
    retiradas, moedaSaida, bolaoSaida, mktSaida, pix, fiado, troca, raspSaida, outros,
  ]);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const st = JSON.parse(saved);
        setDinheiro(st.dinheiro ?? [""]);
        setMoedaEntrada(st.moedaEntrada ?? "");
        setTarifa(st.tarifa ?? "");
        setBolaoEntrada(st.bolaoEntrada ?? "");
        setMktEntrada(st.mktEntrada ?? [""]);
        setRecebimentos(st.recebimentos ?? [{ nome: "", valor: "" }]);
        setTelesena(st.telesena ?? "");
        setRaspQtd(st.raspQtd ?? { "2.50": "0", "5.00": "0", "10.00": "0", "20.00": "0" });
        setEmCaixa(st.emCaixa ?? "");

        setRetiradas(st.retiradas ?? [""]);
        setMoedaSaida(st.moedaSaida ?? "");
        setBolaoSaida(st.bolaoSaida ?? "");
        setMktSaida(st.mktSaida ?? [""]);
        setPix(st.pix ?? [{ nome: "", valor: "" }]);
        setFiado(st.fiado ?? [{ nome: "", valor: "" }]);
        setTroca(st.troca ?? "");
        setRaspSaida(st.raspSaida ?? [""]);
        setOutros(st.outros ?? [{ nome: "", valor: "" }]);
      } catch {}
    })();
  }, []);

  const salvar = async () => {
    const state = {
      dinheiro, moedaEntrada, tarifa, bolaoEntrada, mktEntrada, recebimentos, telesena, raspQtd, emCaixa,
      retiradas, moedaSaida, bolaoSaida, mktSaida, pix, fiado, troca, raspSaida, outros,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    Alert.alert("Salvo", "Fechamento salvo no dispositivo!");
  };

  const limpar = () => {
    setDinheiro([""]); setMoedaEntrada(""); setTarifa(""); setBolaoEntrada("");
    setMktEntrada([""]); setRecebimentos([{ nome: "", valor: "" }]); setTelesena("");
    setRaspQtd({ "2.50": "0", "5.00": "0", "10.00": "0", "20.00": "0" }); setEmCaixa("");

    setRetiradas([""]); setMoedaSaida(""); setBolaoSaida(""); setMktSaida([""]);
    setPix([{ nome: "", valor: "" }]); setFiado([{ nome: "", valor: "" }]); setTroca("");
    setRaspSaida([""]); setOutros([{ nome: "", valor: "" }]);

    Alert.alert("Limpo", "Todos os campos foram limpos.");
  };

  const enviar = () => {
    Alert.alert("Enviar", "Confirma enviar para a planilha?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            const body = {
              entradaDinheiro: dinheiro,
              entradaFixos: { Moeda: moedaEntrada, Tarifa: tarifa, "Bolão": bolaoEntrada, Mkt: "", Telesena: telesena },
              entradaMkt: mktEntrada,
              entradaRecebimentos: recebimentos,
              entradaDenomQtds: raspQtd,
              emCaixa,
              saidaRetiradas: retiradas,
              saidaFixos: { Moeda: moedaSaida, "Bolão": bolaoSaida, Mkt: "", Troca: troca },
              saidaPix: pix,
              saidaFiados: fiado,
              saidaOutros: outros,
              saidaRaspinhaValores: raspSaida,
              saidaMkt: mktSaida,
            };
            const res = await fetch(APPSCRIPT_URL, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!json.ok) throw new Error(json.error || "Erro no servidor");
            Alert.alert("Sucesso", "Fechamento enviado para a planilha!");
          } catch (e: any) {
            Alert.alert("Erro", String(e?.message || e));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
        <Text style={S.titulo}>Fechamento</Text>

        {/* Mensagem de boas-vindas */}
        <View style={S.greetRow}>
          <Text style={S.greetText}>
            Olá, {userInfo?.nome || "Caixa"}, espero que você tenha um dia maravilhoso.
          </Text>
          <Ionicons name="heart" size={16} color={C.accent} />
        </View>

        {/* Abas internas */}
        <View style={S.tabsRow}>
          <Pressable style={[S.tabBtn, sec === "entrada" && S.tabBtnActive]} onPress={() => setSec("entrada")}>
            <Text style={[S.tabText, sec === "entrada" && S.tabTextActive]}>Entrada</Text>
          </Pressable>
          <Pressable style={[S.tabBtn, sec === "saida" && S.tabBtnActive]} onPress={() => setSec("saida")}>
            <Text style={[S.tabText, sec === "saida" && S.tabTextActive]}>Saída</Text>
          </Pressable>
        </View>

        {/* ===== ENTRADA ===== */}
        {sec === "entrada" && (
          <>
            {/* CARD GRANDE - formulário */}
            <View style={S.card}>
              <Text style={S.sectionHeader}>Lançamentos de Entrada</Text>

              <Group
                title="Dinheiro"
                items={dinheiro.map((v) => ({ valor: v }))}
                onAdd={() => setDinheiro((p) => [...p, ""])}
                onRemove={() => setDinheiro((p) => (p.length > 1 ? p.slice(0, -1) : p))}
                renderItem={(item, i) => (
                  <NumericInput
                    key={i}
                    placeholder={`Dinheiro ${i + 1}`}
                    value={dinheiro[i]}
                    onChangeText={(t) => setDinheiro((p) => p.map((x, idx) => (idx === i ? t : x)))}
                  />
                )}
              />

              <Text style={S.label}>Moeda</Text>
              <NumericInput value={moedaEntrada} onChangeText={setMoedaEntrada} />

              <Text style={S.label}>Tarifa</Text>
              <NumericInput value={tarifa} onChangeText={setTarifa} />

              <Text style={S.label}>Bolão</Text>
              <NumericInput value={bolaoEntrada} onChangeText={setBolaoEntrada} />

              <Group
                title="Mkt"
                items={mktEntrada.map((v) => ({ valor: v }))}
                onAdd={() => setMktEntrada((p) => [...p, ""])}
                onRemove={() => setMktEntrada((p) => (p.length > 1 ? p.slice(0, -1) : p))}
                renderItem={(item, i) => (
                  <NumericInput
                    key={i}
                    placeholder={`Mkt ${i + 1}`}
                    value={mktEntrada[i]}
                    onChangeText={(t) => setMktEntrada((p) => p.map((x, idx) => (idx === i ? t : x)))}
                  />
                )}
              />

              {/* Recebimento com seletor de cliente (nome não digitável) + valor numérico */}
              <ClientValueGroup
                title="Recebimento"
                items={recebimentos}
                setItems={setRecebimentos}
                onPick={openPicker}
                kind="receb"
              />

              <Text style={S.label}>Telesena</Text>
              <NumericInput value={telesena} onChangeText={setTelesena} />

              {/* Raspinha ENTRADA — compacto e sem quebra */}
              <View style={{ marginBottom: 8 }}>
                <View style={S.groupHeader}><Text style={S.groupTitle}>Raspinha (quantidades)</Text><View /></View>

                {([
                  { key: "2.50", label: "2,50", mult: 2.5 },
                  { key: "5.00", label: "5,00", mult: 5 },
                  { key: "10.00", label: "10,00", mult: 10 },
                  { key: "20.00", label: "20,00", mult: 20 },
                ] as const).map(({ key, label, mult }) => {
                  const q = Number(raspQtd[key] || 0);
                  return (
                    <View key={key} style={{ marginBottom: 4 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "nowrap" as any,
                        }}
                      >
                        <Text numberOfLines={1} style={[S.groupTitle, { width: 72 }]}>R$ {label}</Text>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                          <Pressable
                            style={S.smallBtn}
                            onPress={() => setRaspQtd((p) => ({ ...p, [key]: String(Math.max(0, (Number(p[key] || 0) - 1) | 0)) }))}
                          >
                            <Ionicons name="remove-circle" size={20} color={C.accent} />
                          </Pressable>

                          <View style={{ width: 80, marginHorizontal: 4 }}>
                            <TextInput
                              style={[S.input, S.inputCompact]}
                              keyboardType="numeric"
                              inputMode="numeric"
                              placeholder="Qtd"
                              value={String(raspQtd[key] || "")}
                              onChangeText={(t) => {
                                if (t === "") return setRaspQtd((p) => ({ ...p, [key]: "" }));
                                const n = Math.max(0, parseInt(t.replace(/\D+/g, "") || "0", 10));
                                setRaspQtd((p) => ({ ...p, [key]: String(n) }));
                              }}
                            />
                          </View>

                          <Pressable
                            style={S.smallBtn}
                            onPress={() => setRaspQtd((p) => ({ ...p, [key]: String(((Number(p[key] || 0) + 1) | 0)) }))}
                          >
                            <Ionicons name="add-circle" size={20} color={C.accent} />
                          </Pressable>
                        </View>

                        <View style={{ width: 110, marginLeft: 8 }}>
                          <TextInput
                            style={[S.input, S.inputCompact, { opacity: 0.6 }]}
                            editable={false}
                            value={currency(q * mult)}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}

                <Text style={[S.label, { marginTop: 2 }]}>
                  Total Raspinha: {currency(
                    (Number(raspQtd["2.50"] || 0) * 2.5) +
                    (Number(raspQtd["5.00"]  || 0) * 5) +
                    (Number(raspQtd["10.00"] || 0) * 10) +
                    (Number(raspQtd["20.00"] || 0) * 20)
                  )}
                </Text>
              </View>

              <Text style={S.label}>Em Caixa</Text>
              <NumericInput value={emCaixa} onChangeText={setEmCaixa} />
            </View>

            {/* CARD PEQUENO - resumo desta aba + totais gerais */}
            <View style={S.cardSmall}>
              <Text style={S.sectionHeader}>Resumo — Entrada</Text>
              <View style={S.resumoRow}><Text style={S.resumoLabel}>Subtotal Entrada</Text><Text style={S.resumoValor}>{currency(totais.subtotalEntrada)}</Text></View>
              <View style={S.resumoRow}><Text style={S.resumoLabel}>Total Saída</Text><Text style={S.resumoValor}>{currency(totais.saida)}</Text></View>
              <View style={S.resumoRow}><Text style={S.resumoLabel}>Resultado</Text><Text style={S.resumoValor}>{currency(totais.resultado)}</Text></View>
            </View>
          </>
        )}

        {/* ===== SAÍDA ===== */}
        {sec === "saida" && (
          <>
            {/* CARD GRANDE - formulário */}
            <View style={S.card}>
              <Text style={S.sectionHeader}>Lançamentos de Saída</Text>

              <Group
                title="Retirada"
                items={retiradas.map((v) => ({ valor: v }))}
                onAdd={() => setRetiradas((p) => [...p, ""])}
                onRemove={() => setRetiradas((p) => (p.length > 1 ? p.slice(0, -1) : p))}
                renderItem={(item, i) => (
                  <NumericInput
                    key={i}
                    placeholder={`Retirada ${i + 1}`}
                    value={retiradas[i]}
                    onChangeText={(t) => setRetiradas((p) => p.map((x, idx) => (idx === i ? t : x)))}
                  />
                )}
              />

              <Text style={S.label}>Moeda</Text>
              <NumericInput value={moedaSaida} onChangeText={setMoedaSaida} />

              <Text style={S.label}>Bolão</Text>
              <NumericInput value={bolaoSaida} onChangeText={setBolaoSaida} />

              <Group
                title="Mkt"
                items={mktSaida.map((v) => ({ valor: v }))}
                onAdd={() => setMktSaida((p) => [...p, ""])}
                onRemove={() => setMktSaida((p) => (p.length > 1 ? p.slice(0, -1) : p))}
                renderItem={(item, i) => (
                  <NumericInput
                    key={i}
                    placeholder={`Mkt ${i + 1}`}
                    value={mktSaida[i]}
                    onChangeText={(t) => setMktSaida((p) => p.map((x, idx) => (idx === i ? t : x)))}
                  />
                )}
              />

              <Text style={S.label}>Troca</Text>
              <NumericInput value={troca} onChangeText={setTroca} />

              {/* Pix (nome texto + valor numérico) */}
              <NameValueGroup title="Pix" items={pix} setItems={setPix} forceNumericValue />

              {/* Fiado (seletor de clientes + valor numérico) */}
              <ClientValueGroup title="Fiado" items={fiado} setItems={setFiado} onPick={openPicker} kind="fiado" />

              {/* Raspinha (Saída) — apenas valor, dinâmico */}
              <Group
  title="Raspinha"
  items={raspSaida.map((v) => ({ valor: v }))} // 👈 mapeia string -> {valor}
  onAdd={() => setRaspSaida((p) => [...p, ""])}
  onRemove={() => setRaspSaida((p) => (p.length > 1 ? p.slice(0, -1) : p))}
  renderItem={(item, i) => (
    <NumericInput
      key={i}
      placeholder={`Raspinha ${i + 1}`}
      value={item.valor} // 👈 usa item.valor (evita [object Object])
      onChangeText={(t) =>
        setRaspSaida((p) => p.map((x, idx) => (idx === i ? t : x)))
      }
    />
  )}
/>


              {/* Outros (nome texto + valor numérico) */}
              <NameValueGroup title="Outros" items={outros} setItems={setOutros} forceNumericValue />
            </View>

            {/* CARD PEQUENO - resumo desta aba + totais gerais */}
            <View style={S.cardSmall}>
              <Text style={S.sectionHeader}>Resumo — Saída</Text>
              <View style={S.resumoRow}><Text style={S.resumoLabel}>Subtotal Saída</Text><Text style={S.resumoValor}>{currency(totais.subtotalSaida)}</Text></View>
              <View style={S.resumoRow}><Text style={S.resumoLabel}>Total Entrada</Text><Text style={S.resumoValor}>{currency(totais.entrada)}</Text></View>
              <View style={S.resumoRow}><Text style={S.resumoLabel}>Resultado</Text><Text style={S.resumoValor}>{currency(totais.resultado)}</Text></View>
            </View>
          </>
        )}

        {/* Botões de ação */}
        <View style={S.actionButtonsRow}>
          <Pressable style={S.actionButton} onPress={salvar}>
            <Ionicons name="save-outline" size={18} color={C.accent} style={{ marginRight: 6 }} />
            <Text style={S.actionButtonText}>Salvar</Text>
          </Pressable>
          <Pressable style={S.actionButton} onPress={limpar}>
            <Ionicons name="trash-outline" size={18} color={C.accent} style={{ marginRight: 6 }} />
            <Text style={S.actionButtonText}>Limpar</Text>
          </Pressable>
          <Pressable style={S.actionButton} onPress={enviar}>
            <Ionicons name="send-outline" size={18} color={C.accent} style={{ marginRight: 6 }} />
            <Text style={S.actionButtonText}>Enviar</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal seletor de clientes (usado por Recebimento e Fiado) */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={S.modalBackdrop}>
          <View style={S.modalCard}>
            <Text style={[S.label, { marginTop: 0 }]}>Selecionar cliente</Text>
            <TextInput
              style={S.searchInput}
              placeholder="Buscar nome…"
              placeholderTextColor="#9c6e82"
              value={pickerSearch}
              onChangeText={setPickerSearch}
            />
            <ScrollView>
              {filteredClientes.map((nome) => (
                <Pressable key={nome} style={S.chip} onPress={() => chooseClient(nome)}>
                  <Text style={S.chipText}>{nome}</Text>
                </Pressable>
              ))}
              {filteredClientes.length === 0 && (
                <Text style={{ color: C.textDark, padding: 8 }}>Nenhum cliente encontrado.</Text>
              )}
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
              <Pressable style={S.tabBtn} onPress={() => setPickerOpen(false)}>
                <Text style={S.tabText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** ===== Componentes auxiliares ===== */

function Group({
  title, items, onAdd, onRemove, renderItem,
}: { title: string; items: any[]; onAdd: () => void; onRemove: () => void; renderItem: (item: any, i: number) => React.ReactNode; }) {
  return (
    <View style={S.groupCard}>
      <View style={S.groupHeader}>
        <Text style={S.groupTitle}>{title}</Text>
        <View style={S.groupBtns}>
          <Pressable style={S.smallBtn} onPress={onRemove}>
            <Ionicons name="remove-circle" size={20} color={C.accent} />
          </Pressable>
          <Pressable style={S.smallBtn} onPress={onAdd}>
            <Ionicons name="add-circle" size={20} color={C.accent} />
          </Pressable>
        </View>
      </View>
      {items.map((it, i) => renderItem(it, i))}
    </View>
  );
}

/** Input numérico padrão com sanitização */
function NumericInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      style={S.input}
      keyboardType="numeric"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChangeText={(t) => onChangeText(sanitizeNumText(t))}
    />
  );
}

/** Nome + Valor
 * - Nome é TEXTO livre (Pix/Outros)
 * - Valor é NUMÉRICO (sanitize)
 */
function NameValueGroup({
  title, items, setItems, forceNumericValue,
}: {
  title: string;
  items: NameValue[];
  setItems: React.Dispatch<React.SetStateAction<NameValue[]>>;
  forceNumericValue?: boolean; // quando true, valor passa por sanitização numérica
}) {
  return (
    <View style={S.groupCard}>
      <View style={S.groupHeader}>
        <Text style={S.groupTitle}>{title}</Text>
        <View style={S.groupBtns}>
          <Pressable style={S.smallBtn} onPress={() => setItems((p) => (p.length > 1 ? p.slice(0, -1) : p))}>
            <Ionicons name="remove-circle" size={20} color={C.accent} />
          </Pressable>
          <Pressable style={S.smallBtn} onPress={() => setItems((p) => [...p, { nome: "", valor: "" }])}>
            <Ionicons name="add-circle" size={20} color={C.accent} />
          </Pressable>
        </View>
      </View>

      {items.map((it, i) => (
        <View key={i} style={S.row2}>
          <View style={S.col}>
            <TextInput
              style={S.input}
              placeholder="Nome"
              value={it.nome}
              onChangeText={(t) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, nome: t } : x)))}
            />
          </View>
          <View style={S.colLast}>
            <TextInput
              style={S.input}
              keyboardType="numeric"
              inputMode="decimal"
              placeholder="Valor"
              value={it.valor}
              onChangeText={(t) =>
                setItems((p) =>
                  p.map((x, idx) =>
                    idx === i ? { ...x, valor: forceNumericValue ? sanitizeNumText(t) : t }
                                 : x
                  )
                )
              }
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Nome (seletor de clientes) + Valor numérico — para Recebimento e Fiado */
function ClientValueGroup({
  title, items, setItems, onPick, kind,
}: {
  title: string;
  items: NameValue[];
  setItems: React.Dispatch<React.SetStateAction<NameValue[]>>;
  onPick: (kind: "receb" | "fiado", index: number) => void;
  kind: "receb" | "fiado";
}) {
  return (
    <View style={S.groupCard}>
      <View style={S.groupHeader}>
        <Text style={S.groupTitle}>{title}</Text>
        <View style={S.groupBtns}>
          <Pressable style={S.smallBtn} onPress={() => setItems((p) => (p.length > 1 ? p.slice(0, -1) : p))}>
            <Ionicons name="remove-circle" size={20} color={C.accent} />
          </Pressable>
          <Pressable style={S.smallBtn} onPress={() => setItems((p) => [...p, { nome: "", valor: "" }])}>
            <Ionicons name="add-circle" size={20} color={C.accent} />
          </Pressable>
        </View>
      </View>

      {items.map((it, i) => (
        <View key={i} style={S.row2}>
          <View style={S.col}>
            {/* Nome não digitável: abre seletor */}
            <Pressable style={S.nameBox} onPress={() => onPick(kind, i)}>
              {it.nome ? (
                <Text style={S.nameBoxText}>{it.nome}</Text>
              ) : (
                <Text style={S.nameBoxPlaceholder}>Selecionar cliente…</Text>
              )}
            </Pressable>
          </View>
          <View style={S.colLast}>
            <TextInput
              style={S.input}
              keyboardType="numeric"
              inputMode="decimal"
              placeholder="Valor"
              value={it.valor}
              onChangeText={(t) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, valor: sanitizeNumText(t) } : x)))}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
