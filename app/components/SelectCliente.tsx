// app/components/SelectCliente.tsx
import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, ViewStyle, TextStyle } from "react-native";
import { CLIENTES } from "../data/clients";

export default function SelectCliente({
  value,
  onChange,
  label,
  placeholder = "Selecione um cliente",
  inputStyle, // ⬅️ novo: estilo para igualar ao TextInput
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  inputStyle?: ViewStyle | TextStyle;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = CLIENTES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ marginBottom: 0 /* nada de MB aqui para alinhar com o input */ }}>
      {label ? (
        <Text style={{ fontWeight: "800", color: "#dd9aba", marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}

      {/* “Cabeçalho” do select com o MESMO corpo do TextInput */}
      <Pressable
        onPress={() => setOpen(!open)}
        style={[
          {
            backgroundColor: "#fff",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#dd9aba",
            paddingHorizontal: 12,
            height: 44,              // mesma altura do TextInput
            justifyContent: "center" // verticalmente centrado
          },
          inputStyle,
        ]}
      >
        <Text style={{ color: value ? "#832d69" : "#999" }}>
          {value || placeholder}
        </Text>
      </Pressable>

      {open && (
        <View
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#dd9aba",
            borderRadius: 10,
            marginTop: 4,
            maxHeight: 180,
            overflow: "hidden",
          }}
        >
          <TextInput
            placeholder="Pesquisar cliente..."
            value={query}
            onChangeText={setQuery}
            style={{
              paddingHorizontal: 10,
              height: 40,
              borderBottomWidth: 1,
              borderColor: "#f1d0de",
              color: "#832d69",
            }}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                  setQuery("");
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f6e4eb",
                }}
              >
                <Text style={{ color: "#832d69" }}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}