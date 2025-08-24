
import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { s } from "../../styles/shared";

export function GroupHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <View style={s.groupHeader}>
      <Text style={s.groupTitle}>{title}</Text>
      <Pressable onPress={onAdd} style={s.addBtn}>
        <Feather name="plus" size={16} color="#cfe1ff" />
        <Text style={s.addBtnText}>Adicionar</Text>
      </Pressable>
    </View>
  );
}
