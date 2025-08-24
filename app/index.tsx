import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { s } from "../styles/shared";

type User = { user: string; senha: string; nome: string; email: string };

const USERS: User[] = [
  { user: "L644566", senha: "Nanda165", nome: "Fernanda", email: "Fernanda.yuff@gmail.com" },
  { user: "L649624", senha: "Yuri21", nome: "Bruna", email: "brunageounespar@hotmail.com" },
  { user: "L616027", senha: "Lucas10", nome: "Temporário", email: "LotericaBeltrao@gmail.com" },
  { user: "L662735", senha: "Thor05", nome: "Mychely", email: "mychelynragantim@gmail.com" },
];

export default function Login() {
  const router = useRouter();
  const [mat, setMat] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => { try { await AsyncStorage.getItem("auth:user"); } finally { setLoading(false); } })();
  }, []);

  async function entrar() {
    const u = USERS.find((x) => x.user === mat && x.senha === pass);
    if (!u) return Alert.alert("Login inválido", "Verifique o usuário e a senha.");
    await AsyncStorage.setItem("auth:user", JSON.stringify(u));
    router.replace("/(tabs)");
  }

  if (loading) return null;

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.container, { justifyContent: "center", flex: 1 }]}>
        <Text style={s.titulo}>Entrar</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Matrícula</Text>
          <TextInput
            value={mat}
            onChangeText={setMat}
            placeholder="Ex.: L644566"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: "#E7EAF6", borderRadius: 14, padding: 12, marginBottom: 12 }}
          />
          <Text style={s.fieldLabel}>Senha</Text>
          <TextInput
            value={pass}
            onChangeText={setPass}
            placeholder="••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            style={{ borderWidth: 1, borderColor: "#E7EAF6", borderRadius: 14, padding: 12, marginBottom: 16 }}
          />
          <Pressable onPress={entrar} style={[s.btn, s.btnSolid]}>
            <Text style={s.btnText}>Entrar</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
