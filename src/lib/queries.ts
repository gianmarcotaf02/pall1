import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Attendance,
  MatchDetail,
  MatchListItem,
  MatchRow,
  PlayerStatsRow,
  PollDetail,
  PollOptionResult,
  PollRow,
  PollSummary,
  Profile,
  RosterEntry,
  StandingRow,
  TeamSide,
} from "@/types/domain";

type AttendanceRow = { match_id: string; attendance: Attendance };

export async function listMatches(): Promise<MatchListItem[]> {
  const supabase = await createSupabaseServerClient();

  const [matchesResult, playersResult, resultsResult] = await Promise.all([
    supabase.from("matches").select("*").order("match_date", { ascending: false }),
    supabase.from("match_players").select("match_id, attendance"),
    supabase.from("match_results").select("match_id, team_a_score, team_b_score"),
  ]);

  const matches = matchesResult.data ?? [];
  const players = (playersResult.data ?? []) as AttendanceRow[];
  const results = resultsResult.data ?? [];

  const presentCount = new Map<string, number>();
  const maybeCount = new Map<string, number>();
  for (const row of players) {
    if (row.attendance === "present") {
      presentCount.set(row.match_id, (presentCount.get(row.match_id) ?? 0) + 1);
    } else if (row.attendance === "maybe") {
      maybeCount.set(row.match_id, (maybeCount.get(row.match_id) ?? 0) + 1);
    }
  }

  const resultByMatch = new Map(
    results.map((row) => [row.match_id, { team_a_score: row.team_a_score, team_b_score: row.team_b_score }]),
  );

  return matches.map((match) => ({
    id: match.id,
    match_date: match.match_date,
    location: match.location,
    max_players: match.max_players,
    status: match.status,
    format: match.format,
    team_a_name: match.team_a_name,
    team_b_name: match.team_b_name,
    present_count: presentCount.get(match.id) ?? 0,
    maybe_count: maybeCount.get(match.id) ?? 0,
    result: resultByMatch.get(match.id) ?? null,
  }));
}

export function splitMatches(matches: MatchListItem[]) {
  const now = Date.now();
  const upcoming = matches
    .filter((m) => m.status !== "played" && m.status !== "cancelled" && new Date(m.match_date).getTime() >= now - 3 * 3_600_000)
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

  const past = matches
    .filter((m) => !upcoming.includes(m))
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  return { upcoming, past };
}

export function matchesToClose(matches: MatchListItem[]): MatchListItem[] {
  const now = Date.now();
  return matches.filter(
    (match) =>
      match.status === "teams_set" ||
      (match.status === "scheduled" && new Date(match.match_date).getTime() < now),
  );
}

export async function getMatchById(id: string): Promise<MatchRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

type RosterQueryRow = {
  id: string;
  profile_id: string;
  attendance: Attendance;
  team: TeamSide | null;
  goals: number;
  assists: number;
  profiles: {
    nickname: string;
    full_name: string | null;
    avatar_url: string | null;
    jersey_number: number | null;
    is_active: boolean;
  } | null;
};

/** Mappa `profile_id -> codici posizione` per un insieme di profili. */
export async function getPositionsByProfile(
  profileIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (profileIds.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profile_positions")
    .select("profile_id, position_code")
    .in("profile_id", profileIds);

  for (const row of data ?? []) {
    const list = map.get(row.profile_id) ?? [];
    list.push(row.position_code);
    map.set(row.profile_id, list);
  }

  return map;
}

export async function listProfilePositions(): Promise<Map<string, string[]>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profile_positions").select("profile_id, position_code");

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.profile_id) ?? [];
    list.push(row.position_code);
    map.set(row.profile_id, list);
  }
  return map;
}

export async function getRoster(matchId: string): Promise<RosterEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("match_players")
    .select(
      "id, profile_id, attendance, team, goals, assists, profiles:profile_id ( nickname, full_name, avatar_url, jersey_number, is_active )",
    )
    .eq("match_id", matchId);

  const rows = (data ?? []) as unknown as RosterQueryRow[];
  const positionsByProfile = await getPositionsByProfile(rows.map((row) => row.profile_id));

  return rows.map((row) => ({
    matchPlayerId: row.id,
    profileId: row.profile_id,
    nickname: row.profiles?.nickname ?? "—",
    fullName: row.profiles?.full_name ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    jerseyNumber: row.profiles?.jersey_number ?? null,
    isActive: row.profiles?.is_active ?? true,
    positions: positionsByProfile.get(row.profile_id) ?? [],
    attendance: row.attendance,
    team: row.team,
    goals: row.goals,
    assists: row.assists,
  }));
}

export async function getMatchDetail(id: string): Promise<MatchDetail | null> {
  const supabase = await createSupabaseServerClient();

  const [match, roster, result] = await Promise.all([
    getMatchById(id),
    getRoster(id),
    supabase.from("match_results").select("*").eq("match_id", id).maybeSingle(),
  ]);

  if (!match) return null;

  return { match, roster, result: result.data ?? null };
}

export async function getMyAttendance(
  matchId: string,
  profileId: string,
): Promise<Attendance | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("match_players")
    .select("attendance")
    .eq("match_id", matchId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.attendance ?? null;
}

export async function listProfiles(): Promise<Profile[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").order("nickname", { ascending: true });
  return data ?? [];
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listStandings(): Promise<StandingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("standings").select("*");
  return data ?? [];
}

export async function getPlayerStats(profileId: string): Promise<PlayerStatsRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("player_stats")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data ?? null;
}

export async function listPlayerStats(): Promise<PlayerStatsRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("player_stats").select("*");
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/* Sondaggi                                                            */
/* ------------------------------------------------------------------ */

type PollOptionLite = {
  id: string;
  poll_id: string;
  label: string;
  starts_at: string | null;
  sort_order: number;
};

type PollVoteLite = { poll_id: string; option_id: string; profile_id: string };
type ProfileLite = { id: string; nickname: string; avatar_url: string | null };

async function loadPollData() {
  const supabase = await createSupabaseServerClient();
  const [pollsResult, optionsResult, votesResult, profilesResult] = await Promise.all([
    supabase.from("polls").select("*").order("created_at", { ascending: false }),
    supabase.from("poll_options").select("id, poll_id, label, starts_at, sort_order").order("sort_order"),
    supabase.from("poll_votes").select("poll_id, option_id, profile_id"),
    supabase.from("profiles").select("id, nickname, avatar_url"),
  ]);

  return {
    polls: pollsResult.data ?? [],
    options: (optionsResult.data ?? []) as PollOptionLite[],
    votes: (votesResult.data ?? []) as PollVoteLite[],
    profiles: (profilesResult.data ?? []) as ProfileLite[],
  };
}

export function isPollClosed(poll: { is_closed: boolean; closes_at: string | null }) {
  if (poll.is_closed) return true;
  return poll.closes_at !== null && new Date(poll.closes_at).getTime() <= Date.now();
}

function toPollSummary(
  poll: PollRow,
  data: Awaited<ReturnType<typeof loadPollData>>,
  myProfileId: string,
): PollSummary {
  const options = data.options.filter((option) => option.poll_id === poll.id);
  const votes = data.votes.filter((vote) => vote.poll_id === poll.id);
  const creator = data.profiles.find((profile) => profile.id === poll.created_by);

  return {
    id: poll.id,
    question: poll.question,
    details: poll.details,
    allowMultiple: poll.allow_multiple,
    closesAt: poll.closes_at,
    isClosed: poll.is_closed,
    closed: isPollClosed(poll),
    weekStart: poll.week_start,
    createdAt: poll.created_at,
    createdBy: poll.created_by,
    creatorNickname: creator?.nickname ?? "—",
    creatorAvatarUrl: creator?.avatar_url ?? null,
    optionCount: options.length,
    voterCount: new Set(votes.map((vote) => vote.profile_id)).size,
    myVotes: votes.filter((vote) => vote.profile_id === myProfileId).map((vote) => vote.option_id),
  };
}

export async function listPolls(myProfileId: string): Promise<PollSummary[]> {
  const data = await loadPollData();
  return data.polls.map((poll) => toPollSummary(poll, data, myProfileId));
}

export async function getPollDetail(
  id: string,
  myProfileId: string,
): Promise<PollDetail | null> {
  const data = await loadPollData();
  const poll = data.polls.find((item) => item.id === id);
  if (!poll) return null;

  const profileById = new Map(data.profiles.map((profile) => [profile.id, profile]));

  const options: PollOptionResult[] = data.options
    .filter((option) => option.poll_id === poll.id)
    .map((option) => ({
      id: option.id,
      label: option.label,
      startsAt: option.starts_at,
      sortOrder: option.sort_order,
      voters: data.votes
        .filter((vote) => vote.option_id === option.id)
        .map((vote) => {
          const profile = profileById.get(vote.profile_id);
          return {
            profileId: vote.profile_id,
            nickname: profile?.nickname ?? "—",
            avatarUrl: profile?.avatar_url ?? null,
          };
        })
        .sort((a, b) => a.nickname.localeCompare(b.nickname)),
    }));

  return { ...toPollSummary(poll, data, myProfileId), options };
}
