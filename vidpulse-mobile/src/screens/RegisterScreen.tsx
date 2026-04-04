import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { authApi } from "../api";
import { useAuthStore } from "../store";

export default function RegisterScreen({ navigation }: any) {
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name || !form.email || !form.password) return setError("Fill all fields");
    setLoading(true); setError("");
    try {
      const data = await authApi.register(form);
      setAuth(data.user, data.access_token);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <View style={s.logo}><Text style={s.logoText}>VP</Text></View>
            <Text style={s.brand}>VidPulse AI</Text>
          </View>
          <View style={s.card}>
            <Text style={s.title}>Create account</Text>
            <Text style={s.sub}>Start analyzing your videos for free</Text>
            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
            {[
              { key: "name",     label: "FULL NAME",  placeholder: "Your name",         secure: false, keyboard: "default" },
              { key: "email",    label: "EMAIL",       placeholder: "you@example.com",   secure: false, keyboard: "email-address" },
              { key: "password", label: "PASSWORD",    placeholder: "Min 8 characters",  secure: true,  keyboard: "default" },
            ].map(f => (
              <View key={f.key} style={s.inputWrap}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput style={s.input} placeholder={f.placeholder} placeholderTextColor={colors.textDim}
                  secureTextEntry={f.secure} keyboardType={f.keyboard as any} autoCapitalize="none"
                  value={(form as any)[f.key]} onChangeText={v => setForm({ ...form, [f.key]: v })} />
              </View>
            ))}
            <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Login")} style={s.link}>
              <Text style={s.linkText}>Already have an account? <Text style={{ color: colors.primary }}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.bg },
  content:  { padding: 24, paddingTop: 40, paddingBottom: 40 },
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logo:     { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  brand:    { color: colors.text, fontSize: 22, fontWeight: "700" },
  card:     { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.cardBorder },
  title:    { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: 4 },
  sub:      { color: colors.textMuted, fontSize: 14, marginBottom: 24 },
  errorBox: { backgroundColor: "#ef444420", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText:{ color: colors.danger, fontSize: 13 },
  inputWrap:{ marginBottom: 16 },
  label:    { color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  input:    { backgroundColor: colors.elevated, borderRadius: 14, padding: 16, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  btn:      { backgroundColor: colors.primary, borderRadius: 16, padding: 17, alignItems: "center", marginTop: 8 },
  btnText:  { color: "#fff", fontSize: 16, fontWeight: "700" },
  link:     { alignItems: "center", marginTop: 20 },
  linkText: { color: colors.textMuted, fontSize: 14 },
});
