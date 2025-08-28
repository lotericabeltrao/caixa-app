import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const C = { bg: "#ffffffff", accent: "#dd9abaff" };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: "#7a5a6c",
        tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.accent, borderTopWidth: 2 },
        tabBarLabelStyle: { fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Fechamento",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-register" size={size ?? 22} color={color} />
          ),
        }}
      />
      
<Tabs.Screen
        name="malotes"
        options={{
          title: "Malotes",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase-outline" size={size ?? 22} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="analise"   // <-- TEM que existir app/(tabs)/analise.tsx com export default
        options={{
          title: "Análise",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
    
  );
}