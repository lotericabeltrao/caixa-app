
import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { s } from "../styles/shared";

const USERS = [
  { user: "L644566", senha: "Nanda165", nome: "Fernanda",   email: "Fernanda.yuff@gmail.com" },
  { user: "L649624", senha: "Yuri21",   nome: "Bruna",      email: "brunageounespar@hotmail.com" },
  { user: "L616027", senha: "Lucas10",  nome: "Temporário", email: "LotericaBeltrao@gmail.com" },
  { user: "L662735", senha: "Thor05",   nome: "Mychely",    email: "mychelynragantim@gmail.com" },
] as const;

export default function LoginScreen() {
  const r = useRouter();
  const [user, setUser] = useState("");
  const [senha, setSenha] = useState("");
  const [show, setShow] = useState(false);

  async function entrar() {
    const found = USERS.find(u => u.user === user.trim());
    if (!found || found.senha !== senha) {
      Alert.alert("Login inválido", "Usuário ou senha incorretos.");
      return;
    }
    await AsyncStorage.setItem("auth:logged", "1");
    await AsyncStorage.setItem("auth:user", JSON.stringify(found));
    r.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.container, { flex: 1, justifyContent: "center" }]}>
        <View style={[s.card, { padding: 18 }]}>
          <Text style={[s.titulo, { marginBottom: 16 }]}>Entrar</Text>

          <View className="field">
            <Text style={s.label}>Usuário</Text>
            <TextInput
              value={user}
              onChangeText={setUser}
              placeholder="ex: L644566"
              style={s.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="field">
            <Text style={s.label}>Senha</Text>
            <TextInput
              value={senha}
              onChangeText={setSenha}
              placeholder="••••"
              style={s.input}
              secureTextEntry={!show}
            />
            <Pressable onPress={() => setShow(v => !v)} style={{ marginTop: 6, alignSelf: "flex-start" }}>
              <Text style={{ color: "#9fb3c8" }}>{show ? "Ocultar senha" : "Mostrar senha"}</Text>
            </Pressable>
          </View>

          <View style={[s.actions, { marginTop: 4 }]}>
            <Pressable style={[s.btn, s.btnSolid]} onPress={entrar}>
              <Text style={s.btnText}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
