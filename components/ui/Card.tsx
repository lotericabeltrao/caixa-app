import React from "react";
import { View, ViewProps } from "react-native";

export function Card(props: ViewProps) {
  return (
    <View {...props} className={["bg-card border border-border rounded-2xl p-4", props.className || ""].join(" ")} />
  );
}
