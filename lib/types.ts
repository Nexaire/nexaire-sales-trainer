export type ScenarioDifficulty = "easy" | "medium" | "hard";

export type TrainingMode = "full_funnel" | "single_stage";

export type Industry = {
  id: string;
  title: string;
  description: string;
  clientContext: string;
  commonObjections: string[];
  evaluationFocus: string[];
  targetActions: string[];
};

export type SalesStage = {
  id: string;
  title: string;
  description: string;
  managerGoal: string;
  successCriteria: string[];
  commonMistakes: string[];
};

export type TrainingContext = {
  industryId: string;
  mode: TrainingMode;
  stageId?: string;
  scenarioId: string;
};

export type TrainingPromptContext = {
  industry: Industry;
  mode: TrainingMode;
  stage?: SalesStage;
  allStages: SalesStage[];
  scenario: Scenario;
  managerGoal: string;
  clientContext: string;
  commonObjections: string[];
  evaluationFocus: string[];
  targetActions: string[];
  openingMessage: string;
};

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
  baseObjection?: string;
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

export type StageScore = {
  stage: string;
  score: number;
  comment: string;
};

export type EvaluationResult = {
  mode?: TrainingMode;
  industry?: string;
  stage?: string;
  scenario?: string;
  score: number;
  overallScore?: number;
  clientOutcome: string;
  summary: string;
  stageScores?: StageScore[];
  strengths: string[];
  weakStages?: string[];
  mistakes: string[];
  missedQuestions?: string[];
  recommendations: string[];
  betterResponseExample?: string;
  nextTrainingScenario?: string;
  nextRecommendedStage?: string;
};

export type LeadPayload = {
  name: string;
  company: string;
  contact: string;
  comment?: string;
  source?: string;
  consentAccepted?: boolean;
};
