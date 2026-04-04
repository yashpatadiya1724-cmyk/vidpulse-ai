export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
}

export interface Video {
  id: string;
  title: string;
  status: "uploaded" | "processing" | "complete" | "error";
  duration_sec?: number;
  overall_score?: number;
  hook_score?: number;
  virality_score?: number;
  created_at: string;
}

export interface AttentionPoint {
  second: number;
  score: number;
  label: string;
}

export interface DropSegment {
  start_sec: number;
  end_sec: number;
  severity: "low" | "medium" | "high" | "critical";
  avg_score: number;
  motion_level?: number;
}

export interface RecommendationItem {
  timestamp: string;
  problem: string;
  suggestion: string;
  priority: "low" | "medium" | "high";
  category?: string;
}

export interface AnalysisResult {
  video_id: string;
  status: string;
  duration_seconds?: number;
  overall_score?: number;
  hook_score?: number;
  virality_score?: number;
  attention_timeline: AttentionPoint[];
  drops: DropSegment[];
  recommendations: RecommendationItem[];
}
