import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "../theme";
import { videosApi } from "../api";

type Tab = "file" | "youtube";

function isYT(url: string) {
  return /youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/.test(url);
}

export default function UploadScreen({ navigation }: any) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("file");
  const [file, setFile] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: "video/*", copyToCacheDirectory: true });
    if (!r.canceled && r.assets[0]) {
      setFile(r.assets[0]);
      setTitle(r.assets[0].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const uploadFile = async () => {
    if (!file || !title.trim()) return Alert.alert("Error", "Select a file and add a title");
    setLoading(true);
    try {
      const video = await videosApi.upload(file.uri, file.name, title, setProgress);
      qc.invalidateQueries({ queryKey: ["videos"] });
      navigation.navigate("Analysis", { id: video.id });
    } catch (e: any) {
      Alert.alert("Upload failed", e.response?.data?.detail || e.message);
    } finally { setLoading(false); }
  };

  const analyzeYT = async () => {
    if (!ytUrl.trim()) return Alert.alert("Error", "Paste a YouTube URL");
    if (!isYT(ytUrl)) return Alert.alert("Error", "Not a valid YouTube URL");
    setLoading(true);
    try {
      const video = await videosApi.analyzeYoutube(ytUrl, ytTitle || undefined);
      qc.invalidateQueries({ queryKey: ["videos"] });
      navigation.navigate("Analysis", { id: video.id });
    } catch (e: any) {
      Alert.alert("Failed", e.response?.data?.detail || e.message);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Analyze Video</Text>
        <Text style={s.sub}>Upload a file or paste a YouTube URL</Text>

        {/* Tabs */}
        <View style={s.tabs}>
          {(["file", "youtube"] as Tab[]).map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === "file" ? "📁 Upload File" : "▶ YouTube URL"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "file" ? (
          <View style={s.section}>
            <TouchableOpacity style={[s.dropzone, file && s.dropzoneActive]} onPress={pickFile} disabled={loading}>
              {file ? (
                <View style={s.fileInfo}>
                  <Text style={s.fileIcon}>🎬</Text>
                  <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={s.fileSize}>{file.size ? `${(file.size/1048576).toFixed(1)} MB` : ""}</Text>
                  {!loading && <TouchableOpacity onPress={() => { setFile(null); setTitle(""); }}><Text style={s.removeText}>✕ Remove</Text></TouchableOpacity>}
                </View>
              ) : (
                <View style={s.dropEmpty}>
                  <Text style={s.dropIcon}>📤</Text>
                  <Text style={s.dropTitle}>Tap to select video</Text>
                  <Text style={s.dropSub}>MP4, MOV, AVI, WebM · max 500MB</Text>
                </View>
              )}
            </TouchableOpacity>

            {file && (
              <>
                <View style={s.inputCard}>
                  <Text style={s.label}>TITLE</Text>
                  <TextInput style={s.input} value={title} onChangeText={setTitle}
                    placeholder="Video title..." placeholderTextColor={colors.textDim}
                    editable={!loading} />
                </View>
                {loading && (
                  <View style={s.progressCard}>
                    <View style={s.progressHeader}>
                      <Text style={s.progressLabel}>Uploading...</Text>
                      <Text style={s.progressPct}>{progress}%</Text>
                    </View>
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, { width: `${progress}%` as any }]} />
                    </View>
                  </View>
                )}
                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={uploadFile} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>✦ Upload & Analyze</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={s.section}>
            <View style={s.ytBanner}>
              <Text style={s.ytBannerText}>▶ Analyze any YouTube video — paste the URL below</Text>
            </View>
            <View style={s.inputCard}>
              <Text style={s.label}>YOUTUBE URL</Text>
              <TextInput style={s.input} value={ytUrl} onChangeText={setYtUrl}
                placeholder="https://youtube.com/watch?v=..." placeholderTextColor={colors.textDim}
                autoCapitalize="none" keyboardType="url" editable={!loading} />
            </View>
            {ytUrl.length > 0 && (
              <Text style={[s.urlStatus, { color: isYT(ytUrl) ? colors.success : colors.danger }]}>
                {isYT(ytUrl) ? "✓ Valid YouTube URL" : "✗ Invalid URL"}
              </Text>
            )}
            {ytUrl && isYT(ytUrl) && (
              <View style={s.inputCard}>
                <Text style={s.label}>CUSTOM TITLE (OPTIONAL)</Text>
                <TextInput style={s.input} value={ytTitle} onChangeText={setYtTitle}
                  placeholder="Leave blank to use YouTube title..." placeholderTextColor={colors.textDim}
                  editable={!loading} />
              </View>
            )}
            {loading && (
              <View style={s.progressCard}>
                <ActivityIndicator color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={s.progressLabel}>Downloading from YouTube...</Text>
              </View>
            )}
            <TouchableOpacity
              style={[s.btn, (!ytUrl || !isYT(ytUrl) || loading) && s.btnDisabled]}
              onPress={analyzeYT} disabled={!ytUrl || !isYT(ytUrl) || loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>▶ Analyze YouTube Video</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  content:      { padding: 20, paddingBottom: 40 },
  title:        { color: colors.text, fontSize: 26, fontWeight: "700", marginBottom: 4 },
  sub:          { color: colors.textMuted, fontSize: 14, marginBottom: 24 },
  tabs:         { flexDirection: "row", backgroundColor: colors.card, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.cardBorder },
  tab:          { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  tabActive:    { backgroundColor: colors.primary },
  tabText:      { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  tabTextActive:{ color: "#fff" },
  section:      { gap: 14 },
  dropzone:     { backgroundColor: colors.card, borderRadius: 20, borderWidth: 2, borderColor: colors.cardBorder, borderStyle: "dashed", padding: 40, alignItems: "center" },
  dropzoneActive:{ borderColor: colors.primary + "60", backgroundColor: colors.primary + "08" },
  dropEmpty:    { alignItems: "center", gap: 10 },
  dropIcon:     { fontSize: 40 },
  dropTitle:    { color: colors.text, fontSize: 16, fontWeight: "600" },
  dropSub:      { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  fileInfo:     { alignItems: "center", gap: 8 },
  fileIcon:     { fontSize: 40 },
  fileName:     { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: 240, textAlign: "center" },
  fileSize:     { color: colors.textMuted, fontSize: 12 },
  removeText:   { color: colors.danger, fontSize: 12, marginTop: 4 },
  inputCard:    { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  label:        { color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  input:        { color: colors.text, fontSize: 15 },
  progressCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: "row", alignItems: "center" },
  progressHeader:{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10, flex: 1 },
  progressLabel:{ color: colors.textMuted, fontSize: 13 },
  progressPct:  { color: colors.text, fontSize: 13, fontWeight: "700" },
  progressBg:   { height: 6, backgroundColor: colors.elevated, borderRadius: 3, overflow: "hidden", flex: 1 },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  btn:          { backgroundColor: colors.primary, borderRadius: 18, padding: 17, alignItems: "center" },
  btnDisabled:  { opacity: 0.4 },
  btnText:      { color: "#fff", fontSize: 16, fontWeight: "700" },
  ytBanner:     { backgroundColor: colors.primary + "15", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.primary + "30" },
  ytBannerText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  urlStatus:    { fontSize: 12, fontWeight: "600", marginTop: -6 },
});
