import React from "react";
import { View, Text } from "react-native";

export function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void; }) {
  return (
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-text font-semibold text-base">{title}</Text>
      {onAdd && (
        <Text className="text-brand-400 font-semibold" onPress={onAdd}>+ adicionar</Text>
      )}
    </View>
  );
}
