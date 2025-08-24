
import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { s } from "../../styles/shared";
import { maskBRL } from "./currency";

export function FieldRow({
  label,
  value,
  onChangeText,
  onRemove,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  onRemove?: () => void;
}) {
  const handleChange = (t: string) => onChangeText(maskBRL(t));

  return (
    <View style={s.fieldRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        <TextInput value={value} onChangeText={handleChange} style={s.input} keyboardType="number-pad" />
      </View>
      {onRemove && (
        <Pressable onPress={onRemove} style={s.rmBtn}>
          <Feather name="trash-2" size={18} color="#ffbdbd" />
        </Pressable>
      )}
    </View>
  );
}
