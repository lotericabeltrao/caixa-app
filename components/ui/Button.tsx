import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "solid" | "ghost";
  style?: ViewStyle;
};
export function Button({ title, onPress, variant = "solid", style }: Props) {
  if (variant === "ghost") {
    return (
      <Pressable onPress={onPress} style={style} className="border border-border rounded-xl px-4 py-3">
        <Text className="text-textmuted font-medium">{title}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={style} className="bg-brand-600 rounded-xl px-4 py-3">
      <Text className="text-white font-semibold text-center">{title}</Text>
    </Pressable>
  );
}
