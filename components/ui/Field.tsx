
import React from "react";
import { View, Text, TextInput, KeyboardTypeOptions } from "react-native";
import { s } from "../../styles/shared";
import { maskBRL } from "./currency";

export function Field({
  label,
  value,
  onChangeText,
  keyboardType = "number-pad",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
}) {
  const handleChange = (t: string) => {
    if (keyboardType === "number-pad" || keyboardType === "decimal-pad" || keyboardType === "numeric") {
      onChangeText(maskBRL(t));
    } else {
      onChangeText(t);
    }
  };

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        style={s.input}
        keyboardType={keyboardType}
      />
    </View>
  );
}
