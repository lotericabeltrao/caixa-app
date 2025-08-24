import React from "react";
import { View, TextInput, Pressable, Text } from "react-native";

type Props = {
  name: string;
  value: string;
  onChangeName: (t: string) => void;
  onChangeValue: (t: string) => void;
  onRemove?: () => void;
};
export function NameValueRow({ name, value, onChangeName, onChangeValue, onRemove }: Props) {
  return (
    <View className="flex-row gap-2 items-center mb-2">
      <TextInput
        className="flex-1 bg-[#0e1727] border border-border rounded-xl px-3 py-3 text-text"
        placeholder="Nome"
        placeholderTextColor="#6b7c93"
        value={name}
        onChangeText={onChangeName}
      />
      <TextInput
        className="w-32 bg-[#0e1727] border border-border rounded-xl px-3 py-3 text-text"
        placeholder="R$ 0,00"
        placeholderTextColor="#6b7c93"
        value={value}
        onChangeText={onChangeValue}
        keyboardType="numeric"
      />
      {onRemove && (
        <Pressable onPress={onRemove}>
          <Text className="text-danger font-bold">remover</Text>
        </Pressable>
      )}
    </View>
  );
}
