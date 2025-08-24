import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";

type Denom = { label: string; value: number };
type Props = {
  denom: Denom;
  qty: number;
  onInc: () => void;
  onDec: () => void;
  onAdd?: (n: number) => void;
};
export function QuickCounter({ denom, qty, onInc, onDec, onAdd }: Props) {
  const [tmp, setTmp] = React.useState<string>("");
  return (
    <View className="flex-row items-center justify-between border border-border rounded-xl px-3 py-2 mb-2 bg-[#0e1727]">
      <Text className="text-text">{denom.label}</Text>
      <View className="flex-row items-center gap-2">
        <Pressable onPress={onDec}><Text className="text-textmuted text-xl">−</Text></Pressable>
        <Text className="text-text font-semibold w-10 text-center">{qty}</Text>
        <Pressable onPress={onInc}><Text className="text-textmuted text-xl">+</Text></Pressable>
      </View>
      {onAdd && (
        <View className="flex-row items-center gap-1">
          <TextInput
            value={tmp}
            onChangeText={setTmp}
            placeholder="qtd"
            keyboardType="numeric"
            placeholderTextColor="#6b7c93"
            className="w-16 bg-[#0e1727] border border-border rounded-lg px-2 py-1 text-text"
          />
          <Pressable onPress={() => { const n = parseInt(tmp||"0",10); if(!isNaN(n)&&n>0){onAdd(n); setTmp("");}}}>
            <Text className="text-brand-400 font-semibold">adicionar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
