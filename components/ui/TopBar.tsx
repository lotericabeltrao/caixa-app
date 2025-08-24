import React from "react";
import { View, Text } from "react-native";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="w-full bg-card border-b border-border px-4 py-3">
      <Text className="text-text text-xl font-bold">{title}</Text>
      {!!subtitle && <Text className="text-textmuted mt-0.5">{subtitle}</Text>}
    </View>
  );
}
