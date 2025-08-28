// app/(tabs)/analise.tsx (ou o nome da sua tela de Análise)
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const APPSCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxNG2qw7WJ5UxtLfA681FfAy4zk6mg4zrZOMWx15qUPQRvjHG1haZW2KyWCI756iyn-/exec";

const C = {
  bg: "#ffdbd7",
  accent: "#dd9abaff",
  textDark: "#832d69ff",
  white: "#ffffff",
  border: "#dd9abaff",
};

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 16 },
  titulo: { fontSize: 22, fontWeight: "900", color: C.accent, marginBottom: 8 },

  tabsRow: { flexDirection: "row", marginBottom: 12 },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.white,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 3px 8px rgba(0,0,0,0.06)" } as any)
      : { elevation: 2 }),
  },
  tabBtnActive: { backgroundColor: C.accent },
  tabText: { color: C.accent, fontWeight: "900" },
  tabTextActive: { color: "#fff", fontWeight: "900" },

  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 4px 10px rgba(0,0,0,0.08)" } as any)
      : { elevation: 3 }),
  },

  label: { fontWeight: "800", color: C.accent, marginBottom: 6 },
  input: {
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 8 : 10,
    marginBottom: 12,
    color: C.textDark,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowLabel: { color: C.textDark, fontWeight: "800" },
  rowValue: { color: C.textDark, fontWeight: "900" },

  grid2: { flexDirection: "row", gap: 8 },
  col: { flex: 1 },
});

type PainelItem = {
  nome: string;
  tarifa: number;
  raspinha: number;
  comissao: number;
  balanco: number;
};
type PainelResp = {
  ok: boolean;
  period?: { month: string; inicio?: string; fim?: string };
  items?: PainelItem[];
};

type FiadoItem = { nome: string; total: number };
type FiadoResp = { ok: boolean; items?: FiadoItem[] };

const currency = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function thisMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function AnaliseScreen() {
  const [tab, setTab] = useState<"fiado" | "resumo">("fiado");
  const [userInfo, setUserInfo] = useState<{ nome?: string } | null>(null);
 const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(thisMonthKey());
  const [err, setErr] = useState<string | null>(null);
  // painel_cells (comissão/balanço)
  const [painel, setPainel] = useState<PainelItem[] | null>(null);

  // fiado_list (nome + total)
  const [fiado, setFiado] = useState<FiadoItem[]>([]);
  const [search, setSearch] = useState("");

  // carrega usuário (só para título/saudação se quiser)
  useEffect(() => {
    (async () => {
      try {
        const auth = await AsyncStorage.getItem("auth:user");
        if (auth) setUserInfo(JSON.parse(auth));
      } catch {}
    })();
  }, []);

  // busca painel (fixo por mês)
  useEffect(() => {
    (async () => {
      try {
        const url = `${APPSCRIPT_URL}?view=painel_cells&month=${encodeURIComponent(
          month
        )}`;
        const res = await fetch(url);
        const json: PainelResp = await res.json();
        setPainel(json?.ok ? json.items || [] : []);
      } catch {
        setPainel([]);
      }
    })();
  }, [month]);

  // busca fiado (lista completa, sem filtro por mês porque vem de uma tabela agregada)
  useEffect(() => {
    (async () => {
      try {
        const url = `${APPSCRIPT_URL}?view=fiado_list`;
        const res = await fetch(url);
        const json: FiadoResp = await res.json();
        setFiado(json?.ok ? json.items || [] : []);
      } catch {
        setFiado([]);
      }
    })();
  }, []);

  // seleciona a funcionária atual no painel (por nome)
  const current = useMemo(() => {
    if (!painel || painel.length === 0) return null;
    const nome = (userInfo?.nome || "").trim().toLowerCase();
    if (!nome) return null;
    return painel.find((p) => p.nome.trim().toLowerCase() === nome) || null;
  }, [painel, userInfo]);

  const comissaoTarifa = current?.tarifa ?? 0;
  const comissaoRaspinha = current?.raspinha ?? 0;
  const comissaoTotal = (current?.comissao ?? 0) || comissaoTarifa + comissaoRaspinha;

  const filteredFiado = useMemo(() => {
    if (!search.trim()) return fiado;
    const s = search.trim().toLowerCase();
    return fiado.filter((c) => c.nome.toLowerCase().includes(s));
  }, [fiado, search]);

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
        <Text style={S.titulo}>Análise</Text>

        {/* Abas internas */}
        <View style={S.tabsRow}>
          <Pressable
            style={[S.tabBtn, tab === "fiado" && S.tabBtnActive]}
            onPress={() => setTab("fiado")}
          >
            <Text style={[S.tabText, tab === "fiado" && S.tabTextActive]}>
              Fiado
            </Text>
          </Pressable>
          <Pressable
            style={[S.tabBtn, tab === "resumo" && S.tabBtnActive]}
            onPress={() => setTab("resumo")}
          >
            <Text style={[S.tabText, tab === "resumo" && S.tabTextActive]}>
              Resumo
            </Text>
          </Pressable>
        </View>

        {/* Filtro de mês (para o painel) */}
        {tab === "resumo" && (
          <View style={S.card}>
            <Text style={S.label}>Mês Atual</Text>
          </View>
        )}

               {tab === "resumo" && (
          <>
            <View style={S.card}>
              <Text style={S.label}>
                Comissão {current?.nome ? `• ${current.nome} `: ""}
              </Text>

              {loading ? (
                <Text style={{ color: C.textDark }}>Carregando…</Text>
              ) : err ? (
                <Text style={{ color: "crimson" }}>{err}</Text>
              ) : !current ? (
                <Text style={{ color: C.textDark }}>Sem dados.</Text>
              ) : (
                <>
                  <View style={S.row}>
                    <Text style={S.rowLabel}>Raspinha</Text>
                    <Text style={S.rowValue}>{currency(current.raspinha)}</Text>
                  </View>
                  <View style={S.row}>
                    <Text style={S.rowLabel}>Tarifa</Text>
                    <Text style={S.rowValue}>{currency(current.tarifa)}</Text>
                  </View>
                  <View style={S.row}>
                    <Text style={S.rowLabel}>Total</Text>
                    <Text style={S.rowValue}>{currency(current.comissao)}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={S.card}>
              <Text style={S.label}>
                Balanço do mês {current?.nome ? `• ${current.nome} `: ""}
              </Text>

              {loading ? (
                <Text style={{ color: C.textDark }}>Carregando…</Text>
              ) : err ? (
                <Text style={{ color: "crimson" }}>{err}</Text>
              ) : !current ? (
                <Text style={{ color: C.textDark }}>Sem dados.</Text>
              ) : (
                <View style={S.row}>
                  <Text style={S.rowLabel}>Total</Text>
                  <Text style={S.rowValue}>{currency(current.balanco)}</Text>
                </View>
              )}
            </View>
          </>
        )}


     

        {tab === "fiado" && (
          <View style={S.card}>
            <Text style={S.label}>Buscar cliente</Text>
            <TextInput
              style={S.input}
              placeholder="Digite parte do nome…"
              value={search}
              onChangeText={setSearch}
            />

            {/* Cabeçalho */}
            <View style={[S.row, { borderBottomColor: C.border }]}>
              <Text style={[S.rowLabel, { color: C.accent, flex: 1 }]}>
                Nome
              </Text>
              <Text
                style={[
                  S.rowLabel,
                  { color: C.accent, width: 120, textAlign: "right" },
                ]}
              >
                Saldo
              </Text>
            </View>

            {/* Linhas */}
            {(filteredFiado || []).map((c) => (
              <View key={c.nome} style={S.row}>
                <Text style={[S.rowLabel, { flex: 1 }]}>{c.nome}</Text>
                <Text style={[S.rowValue, { width: 120, textAlign: "right" }]}>
                  {currency(c.total)}
                </Text>
              </View>
            ))}

            {filteredFiado.length === 0 && (
              <Text style={{ color: C.textDark, paddingVertical: 8 }}>
                Nenhum cliente encontrado.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}