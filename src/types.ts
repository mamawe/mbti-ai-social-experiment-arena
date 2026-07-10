export type MBTIType = "ENTJ" | "ENFP" | "ISTJ" | "ENTP" | "ISFJ" | "INTJ";

export interface Goal {
  publicGoal: string;
  privateGoal: string;
}

export interface Character {
  id: string; // e.g. "louis", "emily", "ian", "ethan", "ivy", "isabella"
  name: string;
  avatar: string; // short abbreviation or symbol
  color: string; // Tailwind color class, e.g. "emerald", "blue", "rose", etc.
  mbti: MBTIType;
  role: string;
  publicGoal: string;
  privateGoal: string;
  secret: string;
  isSecretUnlocked: boolean;
  
  // Dynamic states
  stress: number; // 0 to 100
  morale: number; // 0 to 100
  socialEnergy: number; // 0 to 100
  alignment: "layoffs" | "pivot" | "sell" | "neutral";
}

export interface Relationship {
  from: string; // character id
  to: string; // character id
  trust: number; // 0 to 100
  respect: number; // 0 to 100
  resentment: number; // 0 to 100
  lastReason?: string;
}

export type EventType =
  | "PUBLIC_MESSAGE"
  | "PRIVATE_MESSAGE"
  | "PROPOSAL_CREATED"
  | "VOTE_CAST"
  | "ALLIANCE_FORMED"
  | "RESOURCE_TRANSFERRED"
  | "SECRET_REVEALED"
  | "WORLD_EVENT"
  | "USER_INTERVENTION"
  | "RELATIONSHIP_UPDATED"
  | "GOAL_UPDATED";

export interface SimulationEvent {
  id: string;
  round: number;
  type: EventType;
  actorId?: string; // character id
  targetIds: string[]; // character ids or general
  visibility: "public" | "private" | "system";
  payload: {
    publicMessage?: string;
    privateThought?: string;
    intention?: string;
    actionType?: string;
    description?: string;
    changes?: string[];
  };
  createdAt: string;
}

export interface HistoricalMetric {
  round: number;
  cashDays: number;
  teamMorale: number;
  consensusLevel: number;
}

export interface WorldState {
  round: number;
  maxRounds: number;
  status: "ongoing" | "ended_layoffs" | "ended_pivot" | "ended_sell" | "ended_collapse_morale" | "ended_collapse_cash" | "ended_stalemate";
  cashDays: number; // starts at 30 days
  teamMorale: number; // starts at 80%
  consensusLevel: number; // starts at 20%
  history?: HistoricalMetric[];
}

export interface Proposal {
  id: "layoffs" | "pivot" | "sell";
  title: string;
  sponsor: string; // character name
  description: string;
  votes: Record<string, "yes" | "no" | "abstain">; // character id -> vote
}

export interface GameSession {
  id: string;
  world: WorldState;
  characters: Character[];
  relationships: Relationship[];
  events: SimulationEvent[];
  proposals: Proposal[];
  directorEnergy: number; // starts at 3
  isGodMode: boolean; // if true, can view all inner thoughts and secrets
  directorNotes?: string[];
}

export interface StepResponse {
  session: GameSession;
  narrativeText?: string;
}
