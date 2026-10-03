import type { Database } from "@/types/database.types";

export type MatchStatus = Database["public"]["Enums"]["match_status"];
export type PlayerRole = Database["public"]["Enums"]["player_role"];
export type Attendance = Database["public"]["Enums"]["attendance_status"];
export type TeamSide = Database["public"]["Enums"]["team_side"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PollRow = Database["public"]["Tables"]["polls"]["Row"];
export type PollOptionRow = Database["public"]["Tables"]["poll_options"]["Row"];
export type PollVoteRow = Database["public"]["Tables"]["poll_votes"]["Row"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type MatchPlayerRow = Database["public"]["Tables"]["match_players"]["Row"];
export type MatchResultRow = Database["public"]["Tables"]["match_results"]["Row"];
export type StandingRow = Database["public"]["Views"]["standings"]["Row"];
export type PlayerStatsRow = Database["public"]["Views"]["player_stats"]["Row"];

export type MatchListItem = {
  id: string;
  match_date: string;
  location: string;
  max_players: number;
  status: MatchStatus;
  team_a_name: string;
  team_b_name: string;
  present_count: number;
  maybe_count: number;
  result: { team_a_score: number; team_b_score: number } | null;
};

export type RosterEntry = {
  matchPlayerId: string;
  profileId: string;
  nickname: string;
  fullName: string | null;
  avatarUrl: string | null;
  jerseyNumber: number | null;
  roles: PlayerRole[];
  isActive: boolean;
  attendance: Attendance;
  team: TeamSide | null;
  goals: number;
  assists: number;
};

export type MatchDetail = {
  match: MatchRow;
  roster: RosterEntry[];
  result: MatchResultRow | null;
};

/* ------------------------------------------------------------------ */
/* Sondaggi                                                            */
/* ------------------------------------------------------------------ */

export type PollVoter = {
  profileId: string;
  nickname: string;
  avatarUrl: string | null;
};

export type PollOptionResult = {
  id: string;
  label: string;
  startsAt: string | null;
  sortOrder: number;
  voters: PollVoter[];
};

export type PollSummary = {
  id: string;
  question: string;
  details: string | null;
  allowMultiple: boolean;
  closesAt: string | null;
  isClosed: boolean;
  /** Chiuso a mano oppure oltre la scadenza. */
  closed: boolean;
  createdAt: string;
  createdBy: string;
  creatorNickname: string;
  creatorAvatarUrl: string | null;
  optionCount: number;
  voterCount: number;
  myVotes: string[];
};

export type PollDetail = PollSummary & {
  options: PollOptionResult[];
};
