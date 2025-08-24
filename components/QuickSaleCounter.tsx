
import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { s } from "../styles/shared";

export const DENOMS = [
  { key: "2.50", label: "2,50", value: 2.5 },
  { key: "5.00", label: "5,00", value: 5 },
  { key: "10.00", label: "10,00", value: 10 },
  { key: "20.00", label: "20,00", value: 20 },
] as const;

export function QuickSaleCounter({
  denom,
  qty,
  onInc,
  onDec,
  onAdd,
}: {
  denom: typeof DENOMS[number];
  qty: number;
  onInc: () => void;
  onDec: () => void;
  onAdd: (q: number) => void;
}) {
  const [qAdd, setQAdd] = useState("1");
  const n = Number.isFinite(qty) ? qty : 0;
  return (
    <View style={s.denomRow}>
      <Text style={s.denomLabel}>{denom.label}</Text>

      <View style={s.stepper}>
        <Pressable onPress={onDec} style={s.stepBtn}><Text style={s.stepBtnText}>-</Text></Pressable>
        <Text style={s.denomQtd}>{n}</Text>
        <Pressable onPress={onInc} style={s.stepBtn}><Text style={s.stepBtnText}>+</Text></Pressable>
      </View>

      <View style={s.addBlock}>
        <TextInput value={qAdd} onChangeText={(t) => setQAdd(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" style={s.addInput} placeholder="Qtd" />
        <Pressable onPress={() => onAdd(Math.max(0, Math.floor(Number(qAdd) || 0)))} style={s.addQuickBtn}>
          <Text style={s.addQuickBtnText}>Adicionar</Text>
        </Pressable>
      </View>

      <Text style={s.denomTotal}>{(n * denom.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Text>
    </View>
  );
}
