import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors } from "../theme";
import { videosApi } from "../api";
import { useAuthStore } from "../store";

const statusColor: Record<string, string> = {
  complete: colors.success, processing: colors.warning,
  uploaded: colors.textMuted, error: colors.danger,
};

function ScoreTag({ label, value, color }: any) {
  return (
    <View style={[st.scoreTag, { borderColor: color + "40" }]}>
      <Text style={[st.scoreVal, { color }]}>{value}</Text>
      <Text style={st.scoreLabel}>{label}</Text>
    </View>
  );
}

function VideoCard({ video, onPress }: any) {
  const isComplete = video.status === "complete";
  const isProcessing = video.status === "processing" || video.status === "uploaded";
  return (
    <TouchableOpacity style={st.card} onPress={() => isComplete && onPress(video.id)} activeOpacity={0.8}>
      <View style={st.cardHeader}>
        <View style={st.cardThumb}>
          <Text style={st.cardThumbText}>▶</Text>
        </View>
        <View style={st.cardInfo}>
          <Text style={st.cardTitle} numberOfLines={2}>{video.title}</Text>
          <View style={st.cardMeta}>
            <View style={[st.statusDot, { backgroundColor: statusColor[video.status] || colors.textMuted }]} />
            <Text style={[st.statusText, { color: statusColor[video.status] || colors.textMuted }]}>
              {video.status === "uploaded" ? "Queued" : video.status}
            </Text>
            {video.duration_sec ? <Text style={st.duration}> · {Math.round(video.duration_sec)}s</Text> : null}
          </View>
        </View>
        {isComplete && <Text style={st.arrow}>›</Text>}
      </View>

      {isComplete && (
        <View style={st.scores}>
          <ScoreTag label="Engagement" value={`${Math.round((video.overall_score||0)*100)}%`} color={colors.accent} />
          <ScoreTag label="Hook" value={`${video.hook_score}/100`} color={colors.primary} />
          <ScoreTag label="Virality" value={`${video.virality_score}%`} color={colors.success} />
        </View>
      )}

      {isProcessing && (
        <View style={st.processingBar}>
          <ActivityIndicator size="small" color={colors.warning} style={{ marginRight: 8 }} />
          <Text style={st.processingText}>AI analyzing your video...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ["videos"], queryFn: videosApi.list, refetchInterval: 5000,
  });

  const complete = (videos as any[]).filter((v: any) => v.status === "complete");
  const avg = (fn: (v: any) => number) =>
    complete.length ? Math.round(complete.reduce((s: number, v: any) => s + fn(v), 0) / complete.length) : 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good day,</Text>
            <Text style={s.name}>{user?.name?.split(" ")[0] || "Creator"} 👋</Text>
          </View>
          <TouchableOpacity style={s.uploadBtn} onPress={() => navigation.navigate("Upload")}>
            <Text style={s.uploadBtnText}>+ Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {complete.length > 0 && (
          <View style={s.statsRow}>
            {[
              { label: "Avg Engagement", value: `${avg(v => (v.overall_score||0)*100)}%`, color: colors.accent },
              { label: "Avg Hook",       value: avg(v => v.hook_score||0),                color: colors.primary },
              { label: "Avg Virality",   value: `${avg(v => v.virality_score||0)}%`,      color: colors.success },
            ].map(stat => (
              <View key={stat.label} style={s.statCard}>
                <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Videos */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Your Videos</Text>
            <Text style={s.sectionCount}>{(videos as any[]).length} total</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (videos as any[]).length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🎬</Text>
              <Text style={s.emptyTitle}>No videos yet</Text>
              <Text style={s.emptyText}>Upload your first video to get AI analysis</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate("Upload")}>
                <Text style={s.emptyBtnText}>Upload Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (videos as any[]).map((v: any) => (
              <VideoCard key={v.id} video={v} onPress={(id: string) => navigation.navigate("Analysis", { id })} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting:     { color: colors.textMuted, fontSize: 13 },
  name:         { color: colors.text, fontSize: 26, fontWeight: "700", marginTop: 2 },
  uploadBtn:    { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  uploadBtnText:{ color: "#fff", fontWeight: "700", fontSize: 14 },
  statsRow:     { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 20, marginTop: 8 },
  statCard:     { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder },
  statVal:      { fontSize: 20, fontWeight: "800" },
  statLabel:    { color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: "center" },
  section:      { paddingHorizontal: 20 },
  sectionHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  sectionCount: { color: colors.textMuted, fontSize: 13 },
  empty:        { alignItems: "center", paddingVertical: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { color: colors.text, fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptyText:    { color: colors.textMuted, fontSize: 14, textAlign: "center", marginBottom: 24 },
  emptyBtn:     { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

const st = StyleSheet.create({
  card:          { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  cardHeader:    { flexDirection: "row", alignItems: "center", gap: 12 },
  cardThumb:     { width: 52, height: 52, backgroundColor: colors.elevated, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardThumbText: { fontSize: 20 },
  cardInfo:      { flex: 1 },
  cardTitle:     { color: colors.text, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  cardMeta:      { flexDirection: "row", alignItems: "center", marginTop: 5 },
  statusDot:     { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText:    { fontSize: 12, textTransform: "capitalize" },
  duration:      { color: colors.textMuted, fontSize: 12 },
  arrow:         { color: colors.textMuted, fontSize: 24 },
  scores:        { flexDirection: "row", gap: 8, marginTop: 14 },
  scoreTag:      { flex: 1, backgroundColor: colors.elevated, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1 },
  scoreVal:      { fontSize: 16, fontWeight: "800" },
  scoreLabel:    { color: colors.textMuted, fontSize: 9, marginTop: 3 },
  processingBar: { flexDirection: "row", alignItems: "center", marginTop: 12, backgroundColor: colors.elevated, borderRadius: 12, padding: 10 },
  processingText:{ color: colors.warning, fontSize: 12 },
});
