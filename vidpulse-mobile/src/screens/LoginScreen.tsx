import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme";
import { authApi } from "../api";
import { useAuthStore } from "../store";

export default function LoginScreen({ navigation }: any) {
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.email || !form.password) return setError("Fill all fields");
    setLoading(true); setError("");
    try {
      const data = await authApi.login(form);
      setAuth(data.user, data.access_token);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logo}><Text style={s.logoText}>VP</Text></View>
            <Text style={s.brand}>VidPulse AI</Text>
            <Text style={s.tagline}>Decode Audience Engagement</Text>
          </View>

          <View style={s.card}>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.sub}>Sign in to your account</Text>

            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

            <View style={s.inputWrap}>
              <Text style={s.label}>EMAIL</Text>
              <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={colors.textDim}
                keyboardType="email-address" autoCapitalize="none" value={form.email}
                onChangeText={v => setForm({ ...form, email: v })} />
            </View>
            <View style={s.inputWrap}>
              <Text style={s.label}>PASSWORD</Text>
              <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={colors.textDim}
                secureTextEntry value={form.password}
                onChangeText={v => setForm({ ...form, password: v })} />
            </View>

            <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Register")} style={s.link}>
              <Text style={s.linkText}>No account? <Text style={{ color: colors.primary }}>Create one free</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  content:   { padding: 24, paddingTop: 40, paddingBottom: 40 },
  logoWrap:  { alignItems: "center", marginBottom: 32 },
  logo:      { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoText:  { color: "#fff", fontSize: 22, fontWeight: "800" },
  brand:     { color: colors.text, fontSize: 22, fontWeight: "700" },
  tagline:   { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  card:      { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.cardBorder },
  title:     { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: 4 },
  sub:       { color: colors.textMuted, fontSize: 14, marginBottom: 24 },
  errorBox:  { backgroundColor: "#ef444420", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: colors.danger, fontSize: 13 },
  inputWrap: { marginBottom: 16 },
  label:     { color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  input:     { backgroundColor: colors.elevated, borderRadius: 14, padding: 16, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  btn:       { backgroundColor: colors.primary, borderRadius: 16, padding: 17, alignItems: "center", marginTop: 8 },
  btnText:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  link:      { alignItems: "center", marginTop: 20 },
  linkText:  { color: colors.textMuted, fontSize: 14 },
});
