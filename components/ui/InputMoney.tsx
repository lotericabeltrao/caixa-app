import React from "react";
import { View, Text, TextInput } from "react-native";

type Props = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
};
export function InputMoney({ label, value, onChangeText, placeholder }: Props) {
  return (
    <View className="mb-3">
      {label && <Text className="text-textmuted mb-1">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder || "R$ 0,00"}
        placeholderTextColor="#6b7c93"
        className="bg-[#0e1727] border border-border rounded-xl px-3 py-3 text-text"
      />
    </View>
  );
}
