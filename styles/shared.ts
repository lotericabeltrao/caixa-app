import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { padding: 16, gap: 12 },
  titulo: { color: "#1F2A37", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F0F2F8",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#A9B8FF",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { color: "#1F2A37", fontSize: 16, fontWeight: "800", marginBottom: 6 },
  btn: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  btnSolid: { backgroundColor: "#7C83FD" },
  btnText: { color: "white", fontWeight: "800" },

  // Padrão para labels de formulário
  fieldLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#655ad8",
    marginBottom: 6,
  },
});
