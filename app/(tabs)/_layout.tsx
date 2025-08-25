// app/(tabs)/_layout.tsx
// Tabs sem a aba de Relatórios (removida). Mantém apenas a tela principal de Fechamento (index).
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#655ad8",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Fechamento",
          tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" color={color} size={size} />,
        }}
      />
      {/** Aba de Relatórios removida */}
    </Tabs>
  );
}
