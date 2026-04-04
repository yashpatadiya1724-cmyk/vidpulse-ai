import React, { useState, useEffect } from "react";import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors } from "../theme";
import { analysisApi, videosApi } from "../api";

function ScoreCard({ label, value, color, sub }: any) {
  return (
    <View style={[sc.card, { borderColor: color + "30" }]}>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {sub ? <Text style={sc.sub}>{sub}</Text> : null}
    </View>
  );
}

function BarRow({ label, value, color, max = 100 }: any) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={br.row}>
      <Text style={br.label}>{label}</Text>
      <View style={br.track}>
        <View style={[br.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[br.val, { color }]}>{value}{label !== "Hook" ? "%" : ""}</Text>
    </View>
  );
}

function ProcessingView({ onRefresh }: { onRefresh: () => void }) {
  const steps = ["Extracting frames", "Computing motion", "Running AI", "Generating insights"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={pv.wrap}>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
      <Text style={pv.title}>Analyzing your video</Text>
      <Text style={pv.step}>{steps[step]}...</Text>
      <View style={pv.dots}>
        {steps.map((_, i) => (
          <View key={i} style={[pv.dot, { width: i === step ? 20 : 6, backgroundColor: i === step ? colors.primary : colors.textDim }]} />
        ))}
      </View>
      <TouchableOpacity onPress={onRefresh} style={pv.refreshBtn}>
        <Text style={pv.refreshText}>↻ Check Status</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AnalysisScreen({ route, navigation }: any) {
  const { id } = route.params;

  const { data: video, refetch: rv } = useQuery({
    queryKey: ["video", id], queryFn: () => videosApi.get(id),
    refetchInterval: (data: any) => {
      const v = data?.state?.data as any;
      return (v?.status === "processing" || v?.status === "uploaded") ? 2000 : false;
    },
  });

  const { data: analysis, refetch: ra } = useQuery({
    queryKey: ["analysis", id], queryFn: () => analysisApi.get(id),
    enabled: !!(video as any)?.status && (video as any)?.status === "complete",
    refetchInterval: false,
  });

  const { data: clips = [] } = useQuery({
    queryKey: ["clips", id], queryFn: () => analysisApi.clips(id),
    enabled: !!(video as any)?.status && (video as any)?.status === "complete",
    refetchInterval: false,
  });

  const isProcessing = (video as any)?.status === "uploaded" || (video as any)?.status === "processing";
  const a = analysis as any;

  // Auto-fetch analysis when video becomes complete
  React.useEffect(() => {
    if ((video as any)?.status === "complete") {
      ra();
    }
  }, [(video as any)?.status]);

  const handleShare = async () => {
    if (!a) return;
    await Share.share({
      message: `VidPulse AI Analysis\nVideo: ${(video as any)?.title}\nEngagement: ${Math.round((a.overall_score||0)*100)}%\nHook: ${a.hook_score}/100\nVirality: ${a.virality_score}%`,
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{(video as any)?.title || "Analysis"}</Text>
        {a && (
          <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
            <Text style={s.shareBtnText}>Share</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {isProcessing && <ProcessingView onRefresh={() => { rv(); ra(); }} />}

        {(video as any)?.status === "error" && (
          <View style={s.errorState}>
            <Text style={s.errorIcon}>⚠️</Text>
            <Text style={s.errorTitle}>Analysis failed</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => analysisApi.reanalyze(id).then(() => rv())}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {(video as any)?.status === "complete" && a && (
          <>
            {/* AI Analyzed badge */}
            <View style={s.badges}>
              <View style={s.badge}><Text style={s.badgeText}>✦ AI ANALYZED</Text></View>
              {(clips as any[]).length > 0 && <View style={[s.badge, { borderColor: colors.success + "50" }]}><Text style={[s.badgeText, { color: colors.success }]}>CLIPS READY</Text></View>}
            </View>

            {/* Score cards */}
            <View style={s.scoreRow}>
              <ScoreCard label="OVERALL SCORE" value={`${Math.round((a.overall_score||0)*100)}%`} color={colors.accent} sub="Engagement" />
              <ScoreCard label="DURATION" value={`${Math.round(a.duration_seconds||0)}s`} color={colors.textSub} />
            </View>
            <View style={s.scoreRow}>
              <ScoreCard label="HOOK STRENGTH" value={`${a.hook_score}/100`} color={colors.primary} sub={a.hook_score >= 61 ? "Strong" : a.hook_score >= 31 ? "Average" : "Weak"} />
              <ScoreCard label="VIRALITY" value={`${a.virality_score}%`} color={colors.success} sub="Potential" />
            </View>

            {/* AI Insights Feed */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>✦ AI Insights Feed</Text>
                <View style={s.badge}><Text style={s.badgeText}>{a.recommendations?.length || 0} FINDINGS</Text></View>
              </View>
              {(a.recommendations || []).map((r: any, i: number) => (
                <View key={i} style={[s.insightCard, { borderLeftColor: r.priority === "high" ? colors.danger : r.priority === "medium" ? colors.warning : colors.textMuted }]}>
                  <View style={s.insightHeader}>
                    <Text style={s.insightTime}>{r.timestamp}</Text>
                    <View style={[s.priorityBadge, { backgroundColor: (r.priority === "high" ? colors.danger : r.priority === "medium" ? colors.warning : colors.textMuted) + "20" }]}>
                      <Text style={[s.priorityText, { color: r.priority === "high" ? colors.danger : r.priority === "medium" ? colors.warning : colors.textMuted }]}>
                        {r.priority?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.insightTitle}>{r.problem}</Text>
                  <Text style={s.insightFix}>💡 {r.suggestion}</Text>
                </View>
              ))}
              {(!a.recommendations || a.recommendations.length === 0) && (
                <View style={s.noInsights}>
                  <Text style={s.noInsightsText}>✅ No major issues detected!</Text>
                </View>
              )}
            </View>

            {/* Score breakdown */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Score Breakdown</Text>
              <View style={s.breakdownCard}>
                <BarRow label="Engagement" value={Math.round((a.overall_score||0)*100)} color={colors.accent} />
                <BarRow label="Hook"       value={a.hook_score||0}                      color={colors.primary} max={100} />
                <BarRow label="Virality"   value={a.virality_score||0}                  color={colors.success} />
              </View>
            </View>

            {/* Attention drops */}
            {(a.drops || []).length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Attention Drops ({a.drops.length})</Text>
                {(a.drops || []).map((d: any, i: number) => (
                  <View key={i} style={s.dropRow}>
                    <Text style={s.dropTime}>
                      {Math.floor(d.start_sec/60)}:{String(Math.floor(d.start_sec%60)).padStart(2,"0")}
                      {" → "}
                      {Math.floor(d.end_sec/60)}:{String(Math.floor(d.end_sec%60)).padStart(2,"0")}
                    </Text>
                    <View style={[s.sevBadge, { backgroundColor: (d.severity === "critical" ? colors.danger : d.severity === "high" ? "#f97316" : d.severity === "medium" ? colors.warning : colors.textMuted) + "20" }]}>
                      <Text style={[s.sevText, { color: d.severity === "critical" ? colors.danger : d.severity === "high" ? "#f97316" : d.severity === "medium" ? colors.warning : colors.textMuted }]}>
                        {d.severity}
                      </Text>
                    </View>
                    <Text style={s.dropScore}>{(d.avg_score*100).toFixed(0)}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Best clips */}
            {(clips as any[]).length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>✂ Best Clip Windows</Text>
                {(clips as any[]).map((c: any, i: number) => (
                  <View key={i} style={s.clipCard}>
                    <View style={s.clipLeft}>
                      <Text style={s.clipLabel}>{c.label}</Text>
                      <Text style={s.clipTime}>{c.start_fmt} → {c.end_fmt}</Text>
                    </View>
                    <Text style={s.clipScore}>{Math.round(c.avg_score*100)}%</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:      { width: 36, height: 36, backgroundColor: colors.card, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  backText:     { color: colors.text, fontSize: 24, lineHeight: 28 },
  headerTitle:  { flex: 1, color: colors.text, fontSize: 15, fontWeight: "600" },
  shareBtn:     { backgroundColor: colors.primary + "20", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  shareBtnText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  content:      { padding: 16, paddingBottom: 40 },
  badges:       { flexDirection: "row", gap: 8, marginBottom: 16 },
  badge:        { borderWidth: 1, borderColor: colors.primary + "50", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:    { color: colors.primary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  scoreRow:     { flexDirection: "row", gap: 12, marginBottom: 12 },
  section:      { marginBottom: 20 },
  sectionHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 12 },
  insightCard:  { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: colors.cardBorder },
  insightHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  insightTime:  { color: colors.textMuted, fontSize: 11, fontFamily: "monospace" },
  priorityBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: "700" },
  insightTitle: { color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 6, lineHeight: 20 },
  insightFix:   { color: colors.accent, fontSize: 13, lineHeight: 18 },
  noInsights:   { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: "center" },
  noInsightsText:{ color: colors.success, fontSize: 14 },
  breakdownCard:{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  dropRow:      { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.cardBorder },
  dropTime:     { flex: 1, color: colors.textMuted, fontSize: 12, fontFamily: "monospace" },
  sevBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 8 },
  sevText:      { fontSize: 11, fontWeight: "600" },
  dropScore:    { color: colors.textMuted, fontSize: 12 },
  clipCard:     { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.success + "30" },
  clipLeft:     { flex: 1 },
  clipLabel:    { color: colors.success, fontSize: 13, fontWeight: "600" },
  clipTime:     { color: colors.textMuted, fontSize: 12, marginTop: 2, fontFamily: "monospace" },
  clipScore:    { color: colors.success, fontSize: 18, fontWeight: "800" },
  errorState:   { alignItems: "center", paddingVertical: 60 },
  errorIcon:    { fontSize: 48, marginBottom: 16 },
  errorTitle:   { color: colors.text, fontSize: 18, fontWeight: "600", marginBottom: 20 },
  retryBtn:     { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  retryText:    { color: "#fff", fontWeight: "700" },
});

const sc = StyleSheet.create({
  card:  { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center" },
  value: { fontSize: 28, fontWeight: "800" },
  label: { color: colors.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginTop: 4, textAlign: "center" },
  sub:   { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});

const br = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 12, width: 80 },
  track: { flex: 1, height: 8, backgroundColor: colors.elevated, borderRadius: 4, overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 4 },
  val:   { fontSize: 12, fontWeight: "700", width: 36, textAlign: "right" },
});

const pv = StyleSheet.create({
  wrap:       { alignItems: "center", paddingVertical: 60 },
  title:      { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 8 },
  step:       { color: colors.textMuted, fontSize: 14, marginBottom: 24 },
  dots:       { flexDirection: "row", gap: 6, marginBottom: 24 },
  dot:        { height: 6, borderRadius: 3 },
  refreshBtn: { backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.cardBorder },
  refreshText:{ color: colors.primary, fontWeight: "600", fontSize: 14 },
});
