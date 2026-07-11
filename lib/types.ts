export type ScenarioDifficulty = "easy" | "medium" | "hard";
export type ChatRole = "manager" | "client";

export type ScenarioStage =
  | "opening"
  | "clarification"
  | "main_objection"
  | "trust_check"
  | "price_check"
  | "next_step"
  | "close";

export type ClientState = {
  trust: number;
  doubt: number;
  interest: number;
  readiness: number;
  stage: ScenarioStage;
  turn: number;
  /** Used only by the local mock simulator to avoid repeating the same client reply. */
  lastReplyId?: string;
  lastReplyText?: string;
  recentReplyIds?: string[];
};

export type MockClientResponseRule = {
  id: string;
  stage?: ScenarioStage;
  priority: number;
  condition: string;
  message: string;
  nextStage?: ScenarioStage;
  stateDelta?: Partial<Omit<ClientState, "stage" | "turn">>;
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
  managerGoal: string;
  clientProfile: string;
  objections: string[];
  difficulty: ScenarioDifficulty;
  openingMessage: string;
  /** Backward-compatible alias for older UI/API code. Prefer openingMessage. */
  initialClientMessage?: string;
  stages: ScenarioStage[];
  initialState: ClientState;
  responseRules: MockClientResponseRule[];
  successReply: string;
  neutralReply: string;
  failureReply: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type EvaluationResult = {
  score: number;
  clientOutcome: string;
  summary: string;
  strengths: string[];
  mistakes: string[];
  missedQuestions: string[];
  recommendations: string[];
  betterResponseExample: string;
  nextTrainingScenario: string;
};

export type LeadPayload = {
  name: string;
  company: string;
  contact: string;
  comment?: string;
  source?: string;
  consentAccepted?: boolean;
};
