import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// ====== DADOS ESTÁTICOS (edite aqui conforme precisar) ======
const CLIENTES = [
  { nome: "Nelson", cpf: "437.040.699-49", contato: "(44) 9 9154-0344" },
  { nome: "Pelettiero",   cpf: "413.021.929-49", contato: "(44) 9 9819-3843" },
  { nome: "Madereira",    cpf: "626.858.139-34", contato: "Indisponível" },
  { nome: "Minha Grife", cpf: "837.253.349-00", contato: "Indisponível" },
  { nome: "Cantinho",   cpf: "471.756.419-20", contato: "Indisponível" },
  { nome: "Polato",    cpf: "489.933.019-72", contato: "(44) 9 9801-0918" },
  { nome: "Instaladora",    cpf: "832.810.889-53", contato: "(44) 9 9882-2155" },
  { nome: "Lulinha",   cpf: "457.621.559-00", contato: "Indisponível" },
  { nome: "Vino",    cpf: "071.495.609-03", contato: "Indisponível" },
  { nome: "Marli 10",    cpf: "489.922.839-20", contato: "Indisponível" },
];

const CONTAS = [
  { nome: "Rio Movéis", conta: "3734.001.21406-7" },
  { nome: "Kamilla Café",    conta: "3734.595633883-7" },
  { nome: "Joicimara",          conta: "3734.8097873-3" },
  { nome: "Mendonça", conta: "3734.003.29-2" },
  { nome: "Maia",    conta: "3734.809787973-3" },
  { nome: "Orlei",          conta: "3880.978111185-8" },
];

const SERVICOS = [
  { nome: "Habitação 1",    convenio: "10817992" },
  { nome: "Habitação 2",   convenio: "10731543" },
  { nome: "Mercado Pago",   convenio: "10850221" },
  { nome: "Tim",    convenio: "*144#" },
  { nome: "Claro",   convenio: "*1052#" },
];

// ====== ESTILO (mesma linguagem visual das outras telas) ======
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
  titulo: { fontSize: 22, fontWeight: "900", color: C.accent, marginBottom: 12 },

  // Abas internas
  tabsRow: { flexDirection: "row", marginBottom: 12, gap: 10 },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
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

  // Card de cliente
  clienteCard: {
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  linhaNomeCpf: { flexDirection: "row", justifyContent: "space-between" },
  nome: { color: C.textDark, fontWeight: "900" },
  cpf: { color: C.textDark, fontWeight: "800" },
  contato: { marginTop: 4, color: C.textDark, fontWeight: "700" },

  // Tabelas (Contas/Serviços)
  table: {
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  thead: { flexDirection: "row", backgroundColor: C.accent },
  th: { flex: 1, padding: 10 },
  thText: { color: "#fff", fontWeight: "900" },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border },
  td: { flex: 1, padding: 10 },
  tdText: { color: C.textDark, fontWeight: "800" },

  // Busca opcional (para listas maiores)
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
});

// ====== COMPONENTE ======
export default function MalotesScreen() {
  const [tab, setTab] = useState<"clientes" | "contas" | "servicos">("clientes");
  const [searchCliente, setSearchCliente] = useState("");

  const clientesFiltrados = CLIENTES.filter((c) => {
    const s = searchCliente.trim().toLowerCase();
    if (!s) return true;
    return (
      c.nome.toLowerCase().includes(s) ||
      c.cpf.toLowerCase().includes(s) ||
      (c.contato || "").toLowerCase().includes(s)
    );
  });

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
        <Text style={S.titulo}>Malotes</Text>

        {/* Abas internas */}
        <View style={S.tabsRow}>
          <Pressable
            style={[S.tabBtn, tab === "clientes" && S.tabBtnActive]}
            onPress={() => setTab("clientes")}
          >
            <Text style={[S.tabText, tab === "clientes" && S.tabTextActive]}>
              Clientes
            </Text>
          </Pressable>
          <Pressable
            style={[S.tabBtn, tab === "contas" && S.tabBtnActive]}
            onPress={() => setTab("contas")}
          >
            <Text style={[S.tabText, tab === "contas" && S.tabTextActive]}>
              Contas
            </Text>
          </Pressable>
          <Pressable
            style={[S.tabBtn, tab === "servicos" && S.tabBtnActive]}
            onPress={() => setTab("servicos")}
          >
            <Text style={[S.tabText, tab === "servicos" && S.tabTextActive]}>
              Serviços
            </Text>
          </Pressable>
        </View>

        {/* CLIENTES */}
        {tab === "clientes" && (
          <View>
            <View style={S.card}>
              <Text style={S.label}>Buscar</Text>
              <TextInput
                style={S.input}
                placeholder="Filtrar por nome, CPF ou contato…"
                value={searchCliente}
                onChangeText={setSearchCliente}
              />
            </View>

            {clientesFiltrados.map((c, idx) => (
              <View key={`${c.nome}-${idx}`} style={S.clienteCard}>
                <View style={S.linhaNomeCpf}>
                  <Text style={S.nome}>{c.nome}</Text>
                  <Text style={S.cpf}>{c.cpf}</Text>
                </View>
                <Text style={S.contato}>{c.contato}</Text>
              </View>
            ))}

            {clientesFiltrados.length === 0 && (
              <View style={S.card}>
                <Text style={{ color: C.textDark }}>
                  Nenhum cliente encontrado.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* CONTAS */}
        {tab === "contas" && (
          <View style={S.card}>
            <Text style={S.label}>Contas</Text>
            <View style={S.table}>
              <View style={S.thead}>
                <View style={S.th}>
                  <Text style={S.thText}>Nome</Text>
                </View>
                <View style={S.th}>
                  <Text style={S.thText}>Conta</Text>
                </View>
              </View>

              {CONTAS.map((r, idx) => (
                <View key={`${r.nome}-${idx}`} style={S.row}>
                  <View style={S.td}>
                    <Text style={S.tdText}>{r.nome}</Text>
                  </View>
                  <View style={S.td}>
                    <Text style={S.tdText}>{r.conta}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SERVIÇOS */}
        {tab === "servicos" && (
          <View style={S.card}>
            <Text style={S.label}>Serviços</Text>
            <View style={S.table}>
              <View style={S.thead}>
                <View style={S.th}>
                  <Text style={S.thText}>Nome</Text>
                </View>
                <View style={S.th}>
                  <Text style={S.thText}>Convênio</Text>
                </View>
              </View>

              {SERVICOS.map((r, idx) => (
                <View key={`${r.nome}-${idx}`} style={S.row}>
                  <View style={S.td}>
                    <Text style={S.tdText}>{r.nome}</Text>
                  </View>
                  <View style={S.td}>
                    <Text style={S.tdText}>{r.convenio}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}