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

const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNG2qw7WJ5UxtLfA681FfAy4zk6mg4zrZOMWx15qUPQRvjHG1haZW2KyWCI756iyn-/exec";

const C = { bg: "#ffdbd7", accent: "#dd9abaff", textDark: "#832d69ff", white: "#ffffff", border: "#dd9abaff" };

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
    backgroundColor: C.white, // branco mesmo inativa
    ...(Platform.OS === "web" ? { boxShadow: "0 3px 8px rgba(0,0,0,0.06)" as any } : { elevation: 2 }),
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
      ? { boxShadow: "0 4px 10px rgba(0,0,0,0.08)" as any }
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

  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  rowLabel: { color: C.textDark, fontWeight: "800" },
  rowValue: { color: C.textDark, fontWeight: "900" },
});

type DashboardData = {
  month: string;
  comissaoRaspinha: number;
  comissaoTarifa: number;
  totalEntrada: number;
  totalSaida: number;
  totalResultado: number;
  clientesFiado?: { nome: string; total: number }[];
};

const currency = (n: number) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function thisMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function AnaliseScreen() {
  const [tab, setTab] = useState<"fiado" | "resumo">("fiado");
  const [userInfo, setUserInfo] = useState<{ nome?: string } | null>(null);

  const [month, setMonth] = useState(thisMonthKey());
  const [data, setData] = useState<DashboardData | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const auth = await AsyncStorage.getItem("auth:user");
        if (auth) setUserInfo(JSON.parse(auth));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const url = `${APPSCRIPT_URL}?view=dashboard&month=${encodeURIComponent(month)}`;
        const res = await fetch(url);
        const json = await res.json();
        setData(json?.data || null);
      } catch {
        setData(null);
      }
    })();
  }, [month]);

  const filteredFiado = useMemo(() => {
    const list = data?.clientesFiado || [];
    if (!search.trim()) return list;
    const s = search.trim().toLowerCase();
    return list.filter((c) => c.nome.toLowerCase().includes(s));
  }, [data, search]);

  const comissaoTotal = (data?.comissaoRaspinha || 0) + (data?.comissaoTarifa || 0);

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
        <Text style={S.titulo}>Análise</Text>

        {/* Abas internas */}
        <View style={S.tabsRow}>
          <Pressable style={[S.tabBtn, tab === "fiado" && S.tabBtnActive]} onPress={() => setTab("fiado")}>
            <Text style={[S.tabText, tab === "fiado" && S.tabTextActive]}>Fiado</Text>
          </Pressable>
          <Pressable style={[S.tabBtn, tab === "resumo" && S.tabBtnActive]} onPress={() => setTab("resumo")}>
            <Text style={[S.tabText, tab === "resumo" && S.tabTextActive]}>Resumo</Text>
          </Pressable>
        </View>

        {/* Filtro de mês */}
        <View style={S.card}>
          <Text style={S.label}>Mês (AAAA-MM)</Text>
          <TextInput
            style={S.input}
            placeholder="2025-08"
            value={month}
            onChangeText={setMonth}
            inputMode="numeric"
          />
        </View>

        {tab === "fiado" && (
          <View style={S.card}>
            <Text style={S.label}>Buscar cliente</Text>
            <TextInput
              style={S.input}
              placeholder="Digite o nome…"
              value={search}
              onChangeText={setSearch}
            />

            <View style={{ marginTop: 4 }}>
              <View style={[S.row, { borderBottomColor: C.border }]}>
                <Text style={[S.rowLabel, { color: C.accent }]}>Cliente</Text>
                <Text style={[S.rowLabel, { color: C.accent }]}>Total</Text>
              </View>

              {(filteredFiado || []).map((c) => (
                <View key={c.nome} style={S.row}>
                  <Text style={S.rowLabel}>{c.nome}</Text>
                  <Text style={S.rowValue}>{currency(c.total)}</Text>
                </View>
              ))}

              {filteredFiado.length === 0 && (
                <Text style={{ color: C.textDark, paddingVertical: 8 }}>Nenhum cliente encontrado.</Text>
              )}
            </View>
          </View>
        )}

        {tab === "resumo" && (
          <>
            <View style={S.card}>
              <Text style={S.label}>Comissão</Text>
              <View style={S.row}>
                <Text style={S.rowLabel}>Raspinha</Text>
                <Text style={S.rowValue}>{currency(data?.comissaoRaspinha || 0)}</Text>
              </View>
              <View style={S.row}>
                <Text style={S.rowLabel}>Tarifa</Text>
                <Text style={S.rowValue}>{currency(data?.comissaoTarifa || 0)}</Text>
              </View>
              <View style={S.row}>
                <Text style={S.rowLabel}>Total</Text>
                <Text style={S.rowValue}>{currency(comissaoTotal)}</Text>
              </View>
            </View>

            <View style={S.card}>
              <Text style={S.label}>Balanço do mês</Text>
              <View style={S.row}>
                <Text style={S.rowLabel}>Entrada</Text>
                <Text style={S.rowValue}>{currency(data?.totalEntrada || 0)}</Text>
              </View>
              <View style={S.row}>
                <Text style={S.rowLabel}>Saída</Text>
                <Text style={S.rowValue}>{currency(data?.totalSaida || 0)}</Text>
              </View>
              <View style={S.row}>
                <Text style={S.rowLabel}>Resultado</Text>
                <Text style={S.rowValue}>{currency(data?.totalResultado || 0)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
