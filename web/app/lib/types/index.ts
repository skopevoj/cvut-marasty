/**
 * Consolidated type definitions for the Quiz application.
 * All types are re-exported from here for easy importing.
 */

// Re-export existing types
export * from "./enums";
export * from "./question";
export * from "./subject";
export * from "./subjectDetails";

// ============================================================================
// Settings Types
// ============================================================================

export interface DataSource {
  id: string;
  name: string;
  type: "url" | "local";
  url?: string;
  data?: unknown; // For local file uploads
  enabled: boolean;
}

export type Theme =
  | "dark"
  | "light"
  | "catppuccin-mocha"
  | "catppuccin-latte"
  | "tokyo-night"
  | "tokyo-night-light"
  | "ayu-dark"
  | "night-owl"
  | "marast";

export type BackgroundType = "none" | "gradient" | "image" | "video";

export interface Background {
  id: string;
  name: string;
  type: BackgroundType;
  url?: string;
  gradientStart?: string;
  gradientEnd?: string;
  intensity?: number; // 0-1
}

export interface Settings {
  username?: string;
  uid: string;
  backendUrl?: string;
  showStatsBar: boolean;
  shuffleAnswers: boolean;
  whiteboardEnabled: boolean;
  checkUpdatesOnStartup: boolean;
  theme: Theme;
  monospaceFont: boolean;
  onboardingDone: boolean;
  dataSources: DataSource[];
  backgroundEnabled: boolean;
  backgroundId: string;
  customBackgrounds: Background[];
}

// ============================================================================
// Stats Types
// ============================================================================

export interface QuestionAttempt {
  questionId: string;
  subjectCode: string;
  topic?: string;
  topics?: string[];
  timestamp: number;
  type: "multichoice" | "open" | "yesno";
  userAnswers: Record<number, boolean | number> | string;
  isCorrect: boolean;
  detailed?: Record<number, boolean> | boolean;
  answerHashes?: Record<number, string>;
}

export interface QuestionStats {
  totalAnswered: number;
  history: { timestamp: number; isCorrect: boolean }[];
}

export interface StatsMetrics {
  total: number;
  correct: number;
  percent: number;
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  id: number;
  text: string;
  timestamp: string;
  userUid: string;
  questionHash: string;
  parentId?: number | null;
  user: {
    username: string;
  };
}

// ============================================================================
// Session Types
// ============================================================================

export interface PeerAnswerState {
  peerId: string;
  peerName?: string;
  answers: Record<number, import("./enums").AnswerState>;
}

// ============================================================================
// Peer Collaboration Types
// ============================================================================

export type PeerMessageType =
  | "answer-update"
  | "whiteboard-draw"
  | "whiteboard-clear"
  | "sync-request"
  | "sync-response"
  | "user-joined"
  | "user-left"
  | "navigate"
  | "evaluate"
  | "cursor-move";

export interface PeerMessage {
  type: PeerMessageType;
  data: unknown;
  senderId?: string;
}

export interface ConnectedPeer {
  peerId: string;
  userName?: string;
}

// ============================================================================
// Whiteboard Types
// ============================================================================

export type WhiteboardTool = "pencil" | "eraser";

// ============================================================================
// Data Loading Types
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  messages: string[];
  error: string | null;
}

// ============================================================================
// Raw Data Types (for JSON loaded from sources)
// ============================================================================

export interface RawSubjectData {
  id?: string | number;
  code?: string;
  name?: string;
  title?: string;
  questions?: unknown[];
  primaryColor?: string;
  secondaryColor?: string;
  [key: string]: unknown;
}

export interface RawSourceData {
  subjects: RawSubjectData[];
  metadata?: { hash?: string; repository?: string };
  repository?: string;
  version?: string;
}

// ============================================================================
// Evaluation Types
// ============================================================================

export interface EvaluationResult {
  isCorrect: boolean;
  statsUserAnswers: Record<number, number> | string;
  detailed: Record<number, boolean> | boolean;
  answerHashes?: Record<number, string>;
}
