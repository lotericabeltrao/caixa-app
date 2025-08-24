import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, View, Text, Pressable, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MailComposer from "expo-mail-composer";
import * as FileSystem from "expo-file-system";
import { s } from "../../styles/shared";
import { sanitizeNumber as toNumber } from "../../components/ui/currency";

function hojeKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const STORAGE_KEY = "fechamento:" + hojeKey();
const currency = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RelatoriosScreen() {
  const [data, setData] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved));
      const auth = await AsyncStorage.getItem("auth:user");
      if (auth) setUserInfo(JSON.parse(auth));
    })();
  }, []);

  const sumNameValue = (arr?: any[]) => Array.isArray(arr) ? arr.reduce((a, it) => a + toNumber(it?.valor), 0) : 0;

  const totals = useMemo(() => {
    if (!data) return { entrada: 0, saida: 0, resultado: 0 };
    const somaArr = (arr?: any[]) => (Array.isArray(arr) ? arr.reduce((a, v) => a + toNumber(v), 0) : 0);
    const somaObj = (obj?: Record<string, any>) => obj ? Object.values(obj).reduce((a, v) => a + toNumber(v), 0) : 0;

    const denoms = [
      { key: "2.50", value: 2.5 },
      { key: "5.00", value: 5 },
      { key: "10.00", value: 10 },
      { key: "20.00", value: 20 },
    ];
    const somaDenoms = denoms.reduce((acc, d) => acc + (Number((data?.entradaDenomQtds || {})[d.key]) || 0) * d.value, 0);

    const entrada = somaArr(data?.entradaDinheiro) + somaObj(data?.entradaFixos) + sumNameValue(data?.entradaRecebimentos) + somaDenoms;
    const saida = somaArr(data?.saidaRetiradas) + somaObj(data?.saidaFixos) + sumNameValue(data?.saidaPix) + sumNameValue(data?.saidaFiados) + sumNameValue(data?.saidaOutros);
    return { entrada, saida, resultado: entrada - saida };
  }, [data]);

  async function reenviarEmailHoje() {
    if (!data) {
      Alert.alert("Sem dados", "Preencha o fechamento na primeira aba.");
      return;
    }

    const linhas: string[] = [];
    const dia = hojeKey();
    linhas.push(`Fechamento de Caixa;${dia}`);
    if (userInfo) {
      linhas.push(`Caixa;${userInfo.nome} (${userInfo.user})`);
      linhas.push(`Email;${userInfo.email}`);
    }
    linhas.push("");

    // ENTRADA
    linhas.push("ENTRADA");
    (data.entradaDinheiro || []).forEach((v: string, i: number) => linhas.push(`Dinheiro ${i + 1};${toNumber(v).toFixed(2).replace(".", ",")}`));
    ["Moeda", "Tarifa", "Bolão", "Mkt", "Telesena"].forEach((k) => {
      const v = (data.entradaFixos || {})[k] || "";
      linhas.push(`${k};${toNumber(v).toFixed(2).replace(".", ",")}`);
    });
    const DENOMS = [
      { key: "2.50", label: "2,50", value: 2.5 },
      { key: "5.00", label: "5,00", value: 5 },
      { key: "10.00", label: "10,00", value: 10 },
      { key: "20.00", label: "20,00", value: 20 },
    ] as const;
    const entradaDenomQtds = data.entradaDenomQtds || {};
    DENOMS.forEach((d) => {
      const qtd = Number(entradaDenomQtds[d.key] || 0);
      const total = (qtd * d.value).toFixed(2).replace(".", ",");
      linhas.push(`${d.label} (qtd);${qtd}`);
      linhas.push(`${d.label} (total);${total}`);
    });
    (data.entradaRecebimentos || []).forEach((it: any, i: number) => {
      const label = it?.nome ? `Recebimento ${i + 1} - ${it.nome}` : `Recebimento ${i + 1}`;
      linhas.push(`${label};${toNumber(it?.valor).toFixed(2).replace(".", ",")}`);
    });
    linhas.push(`Total Entrada;${totals.entrada.toFixed(2).replace(".", ",")}`);
    linhas.push("");

    // SAÍDA
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
    linhas.push(`Total Saída;${totals.saida.toFixed(2).replace(".", ",")}`);
    linhas.push("");

    linhas.push(`RESULTADO;${totals.resultado.toFixed(2).replace(".", ",")}`);

    const csv = linhas.join("\n");
    const assunto = `Fechamento de caixa - ${dia}`;

    if (Platform.OS === "web") {
      try {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fechamento_${hojeKey()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const corpo = `Segue o relatório em CSV (baixado no seu dispositivo).%0D%0A%0D%0AResumo:%0D%0A${csv.split("\n").slice(0, 30).join("%0D%0A")}`;
        window.location.href = `mailto:${userInfo?.email || ""}?subject=${encodeURIComponent(assunto)}&body=${corpo}`;
      } catch (e) {
        Alert.alert("Web", "No navegador não é possível anexar arquivos automaticamente. Baixei o CSV para você anexar manualmente.");
      }
      return;
    }

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("E-mail indisponível", "Não foi possível abrir o compositor de e-mail neste dispositivo.");
      return;
    }

    const fileUri = FileSystem.cacheDirectory + `fechamento_${hojeKey()}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

    await MailComposer.composeAsync({
      recipients: [userInfo?.email || ""],
      subject: assunto,
      body: "Segue o relatório de fechamento do dia em anexo.\n\n",
      isHtml: false,
      attachments: [fileUri],
    });
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.titulo}>Relatório do dia ({hojeKey()})</Text>

        {userInfo && (
          <View style={s.card}>
            <Text style={{ color: "#1F2A37", fontWeight: "800", marginBottom: 6 }}>Caixa logado</Text>
            <Text style={{ color: "#4C5C7A", marginBottom: 4 }}>{userInfo.nome} ({userInfo.user})</Text>
            <Text style={{ color: "#6B7280" }}>E‑mail: {userInfo.email}</Text>
          </View>
        )}

        {data ? (
          <View style={s.card}>
            <Row label="Total Entrada" value={currency(totals.entrada)} />
            <Row label="Total Saída" value={currency(totals.saida)} />
            <Row label="Resultado" value={currency(totals.resultado)} strong />
            <View style={{ height: 12 }} />
            <Pressable onPress={reenviarEmailHoje} style={[s.btn, s.btnSolid]}>
              <Text style={s.btnText}>Reenviar por e‑mail</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ color: "#9CA3AF", textAlign: "center" }}>Sem dados salvos hoje. Preencha o fechamento na aba “Fechamento”.</Text>
        )}
      </ScrollView>
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
