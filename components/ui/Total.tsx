
import React from "react";
import { View, Text } from "react-native";
import { s } from "../../styles/shared";

export function Total({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={s.totalRow}>
      <Text style={s.totalLabel}>{label}</Text>
      <Text style={s.totalValue}>
        {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </Text>
    </View>
  );
}
