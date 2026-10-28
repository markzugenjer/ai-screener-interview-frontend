// Shapes returned by the Go API (see backend internal/api/dto.go).

export type Role = "candidate" | "recruiter" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  whatsapp: string;
  resumeName: string;
  createdAt: string;
}

export interface Weights {
  technical: number;
  problemSolving: number;
  communication: number;
  speech: number;
  motivation: number;
}

export type JobStatus = "draft" | "open" | "closed";
export type Level = "junior" | "mid" | "senior";

export interface Job {
  id: string;
  title: string;
  slug: string;
  division: string;
  category: string;
  level: Level;
  location: string;
  employmentType: string;
  description: string;
  requirements: string[];
  skills: string[];
  durationMinutes: number;
  status: JobStatus;
  questionCount: number;
  weights?: Weights;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  jobId?: string;
  skill: string;
  difficulty: 1 | 2 | 3;
  type: "technical" | "scenario" | "soft";
  text: string;
  expectedPoints: string[];
  followUps: string[];
  sort?: number;
}

export type InterviewStatus = "pending" | "in_progress" | "completed" | "scored" | "failed" | "abandoned";

export interface JobBrief {
  title: string;
  slug: string;
  category: string;
  level: Level;
  division: string;
  skills: string[];
  durationMinutes?: number;
}

export interface Interview {
  id: string;
  jobId: string;
  status: InterviewStatus;
  attempt: number;
  isPractice: boolean;
  resetCount: number;
  canReset: boolean;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  createdAt: string;
  job?: JobBrief;
  overall?: number;
  summary?: string;
}

export interface Dimension {
  key: string;
  label: string;
  points: number;
  max: number;
  rating: number;
  notes: string[];
}

export interface CandidateFeedback {
  overall: number;
  summary: string;
  dimensions: Dimension[];
  strengths: string[];
  growth: string[];
  tips: string[];
  scoredAt: string;
}

export type Recommendation = "strong_yes" | "yes" | "maybe" | "no";
export type Decision = "shortlist" | "reject" | "hold";

export interface ResultRow extends Interview {
  candidateName: string;
  candidateEmail: string;
  recommendation: Recommendation | "";
  technical: number | null;
  communication: number | null;
  decision: Decision | "";
}

export interface QuestionScore {
  questionId: string;
  question: string;
  skill: string;
  score: number;
  coveredPoints: string[];
  missedPoints: string[];
  evidence: string;
  reasoning: string;
}

export interface Score {
  interviewId: string;
  overall: number;
  dimensions: Dimension[];
  questionScores: QuestionScore[] | null;
  speech: {
    wordsPerMinute: number;
    fillerWords: number;
    longPauses: number;
    candidateWords: number;
    speakingSeconds: number;
    rating: number;
  };
  recruiterSummary: string;
  candidateSummary: string;
  strengths: string[] | null;
  improvements: string[] | null;
  tips: string[] | null;
  recommendation: Recommendation;
  model: string;
  createdAt: string;
}

export interface Turn {
  speaker: "ai" | "candidate";
  text: string;
  startMs: number;
  endMs: number;
  questionId?: string;
  seq: number;
}

export interface Review {
  id: string;
  interviewId: string;
  reviewerId: string;
  reviewer: string;
  decision: Decision;
  notes: string;
  createdAt: string;
}

export interface ResultDetail {
  interview: Interview;
  integrity: { tabHidden: number; windowBlur: number; pasteEvents: number };
  lastError: string;
  job: Job;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    whatsapp: string;
    resumeName: string;
    hasResume: boolean;
    createdAt: string;
  };
  score: Score | null;
  transcript: Turn[];
  reviews: Review[];
}

export interface Stats {
  openJobs: number;
  candidates: number;
  interviewsTotal: number;
  interviewsScored: number;
  awaitingReview: number;
  averageScore: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}
