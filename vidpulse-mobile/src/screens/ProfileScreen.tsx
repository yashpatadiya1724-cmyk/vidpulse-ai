import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors } from "../theme";
import { useAuthStore } from "../store";
import { videosApi } from "../api";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { data: videos = [] } = useQuery({ queryKey: ["videos"], queryFn: videosApi.list });
  const complete = (videos as any[]).filter((v: any) => v.status === "complete");
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Profile</Text>

        {/* Avatar */}
        <View style={s.avatarCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <View style={s.avatarInfo}>
            <Text style={s.userName}>{user?.name}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
          </View>
          <View style={s.planBadge}><Text style={s.planText}>{user?.plan || "free"}</Text></View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: "Total Videos", value: (videos as any[]).length, color: colors.accent },
            { label: "Analyzed",     value: complete.length,          color: colors.success },
            { label: "Plan",         value: user?.plan || "Free",     color: colors.primary },
          ].map(st => (
            <View key={st.label} style={s.statCard}>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade */}
        {user?.plan === "free" && (
          <View style={s.upgradeBanner}>
            <Text style={s.upgradeTitle}>✦ Upgrade to Pro</Text>
            <Text style={s.upgradeSub}>Unlimited videos · Priority AI · Export reports</Text>
            <TouchableOpacity style={s.upgradeBtn}><Text style={s.upgradeBtnText}>Upgrade</Text></TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>VidPulse AI v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: 20, paddingBottom: 40 },
  title:         { color: colors.text, fontSize: 26, fontWeight: "700", marginBottom: 20 },
  avatarCard:    { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder },
  avatar:        { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText:    { color: "#fff", fontSize: 20, fontWeight: "700" },
  avatarInfo:    { flex: 1 },
  userName:      { color: colors.text, fontSize: 16, fontWeight: "700" },
  userEmail:     { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  planBadge:     { backgroundColor: colors.primary + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  planText:      { color: colors.primary, fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  statsRow:      { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard:      { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder },
  statVal:       { fontSize: 22, fontWeight: "800" },
  statLabel:     { color: colors.textMuted, fontSize: 10, marginTop: 4, textAlign: "center" },
  upgradeBanner: { backgroundColor: colors.primary + "12", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.primary + "30" },
  upgradeTitle:  { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 4 },
  upgradeSub:    { color: colors.textMuted, fontSize: 13, marginBottom: 14 },
  upgradeBtn:    { backgroundColor: colors.primary, borderRadius: 14, padding: 14, alignItems: "center" },
  upgradeBtnText:{ color: "#fff", fontWeight: "700" },
  logoutBtn:     { backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: colors.danger + "30", marginBottom: 20 },
  logoutText:    { color: colors.danger, fontWeight: "700", fontSize: 15 },
  version:       { color: colors.textDim, fontSize: 11, textAlign: "center" },
});
