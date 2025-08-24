import React from "react";
import { View, Text } from "react-native";

export function SummaryBar({ entrada, saida }: { entrada: number; saida: number; }) {
  const res = entrada - saida;
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <View className="mt-3 p-3 border border-border rounded-2xl bg-[#0e1727]">
      <View className="flex-row justify-between mb-1">
        <Text className="text-textmuted">Entrada</Text>
        <Text className="text-ok font-semibold">{fmt(entrada)}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-textmuted">Saída</Text>
        <Text className="text-danger font-semibold">{fmt(saida)}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-text">Resultado</Text>
        <Text className={res >= 0 ? "text-ok font-bold" : "text-danger font-bold"}>{fmt(res)}</Text>
      </View>
    </View>
  );
}
