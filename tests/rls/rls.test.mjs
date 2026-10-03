/**
 * Test delle policy RLS di Pall1.
 *
 * Verifica con un utente normale (anon key) che le regole di sicurezza
 * del database facciano il loro lavoro. Usa la service role key SOLO per
 * creare e distruggere utenti di prova: non viene mai usata per le
 * asserzioni.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=... npm run test:rls
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error(
    "Servono NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const stamp = Date.now();
const password = `Test-${stamp}-pall1`;

let passed = 0;
let failed = 0;

function check(name, condition, extra = "") {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${extra ? ` → ${extra}` : ""}`);
  }
}

async function createUser(nickname) {
  const email = `${nickname}.${stamp}@pall1.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nickname },
  });
  if (error) throw new Error(`Creazione utente fallita: ${error.message}`);
  return { id: data.user.id, email };
}

async function signIn(email) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login fallito: ${error.message}`);
  return client;
}

const created = [];

try {
  console.log("Preparazione utenti di prova…");
  const player = await createUser(`probe${stamp}`);
  const other = await createUser(`other${stamp}`);
  const third = await createUser(`third${stamp}`);
  created.push(player.id, other.id, third.id);

  // Il trigger handle_new_user deve aver creato i profili.
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nickname, is_admin")
    .in("id", [player.id, other.id, third.id]);

  check("il trigger crea il profilo alla registrazione", (profiles ?? []).length === 3);
  check("i nuovi utenti non sono admin", (profiles ?? []).every((p) => p.is_admin === false));

  const playerClient = await signIn(player.email);
  const otherClient = await signIn(other.email);
  const thirdClient = await signIn(third.email);

  console.log("\nLetture");
  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const anonRead = await anonClient.from("profiles").select("id");
  check("anon non legge i profili", (anonRead.data ?? []).length === 0);

  const authRead = await playerClient.from("profiles").select("id");
  check("un utente autenticato legge i profili", (authRead.data ?? []).length >= 2);
  console.log("\nScritture di dominio");
  const matchInsert = await playerClient
    .from("matches")
    .insert({ match_date: new Date().toISOString(), location: "Test RLS" })
    .select("id");
  check(
    "un utente normale non crea partite",
    (matchInsert.data ?? []).length === 0 && matchInsert.error !== null,
    matchInsert.error?.message,
  );

  const { data: match } = await admin
    .from("matches")
    .insert({ match_date: new Date(Date.now() + 86_400_000).toISOString(), location: "Test RLS" })
    .select("id")
    .single();

  console.log("\nEscalation di privilegi");
  await playerClient.from("profiles").update({ is_admin: true, is_active: false }).eq("id", player.id);
  const { data: afterEscalation } = await admin
    .from("profiles")
    .select("is_admin, is_active")
    .eq("id", player.id)
    .single();
  check("is_admin non è auto-assegnabile", afterEscalation?.is_admin === false);
  check("is_active non è auto-modificabile", afterEscalation?.is_active === true);

  console.log("\nIscrizioni");
  const otherJoinForMe = await otherClient
    .from("match_players")
    .insert({ match_id: match.id, profile_id: player.id, attendance: "present" })
    .select("id");
  check(
    "non ci si iscrive a nome di un altro",
    (otherJoinForMe.data ?? []).length === 0,
    otherJoinForMe.error?.message,
  );

  const myJoin = await playerClient
    .from("match_players")
    .insert({ match_id: match.id, profile_id: player.id, attendance: "present" })
    .select("id")
    .single();
  check("ci si iscrive a nome proprio", Boolean(myJoin.data?.id), myJoin.error?.message);

  const cheatTeam = await playerClient
    .from("match_players")
    .update({ team: "a", goals: 5 })
    .eq("id", myJoin.data.id)
    .select("team, goals")
    .single();
  check(
    "squadra e gol non sono auto-assegnabili",
    cheatTeam.data?.team === null && cheatTeam.data?.goals === 0,
    JSON.stringify(cheatTeam.data),
  );

  const cheatResult = await playerClient
    .from("match_results")
    .insert({ match_id: match.id, team_a_score: 10, team_b_score: 0 })
    .select("match_id");
  check(
    "un utente normale non inserisce risultati",
    (cheatResult.data ?? []).length === 0 && cheatResult.error !== null,
    cheatResult.error?.message,
  );

  console.log("\nCapienza");
  await admin.from("matches").update({ max_players: 2 }).eq("id", match.id);

  const otherJoin = await otherClient
    .from("match_players")
    .insert({ match_id: match.id, profile_id: other.id, attendance: "present" })
    .select("id");
  check("il secondo giocatore si iscrive da solo", (otherJoin.data ?? []).length === 1, otherJoin.error?.message);

  const full = await thirdClient
    .from("match_players")
    .insert({ match_id: match.id, profile_id: third.id, attendance: "present" })
    .select("id");
  check(
    "il terzo con la partita piena viene respinto",
    (full.data ?? []).length === 0 && full.error !== null,
    full.error?.message,
  );

  console.log("\nTransizioni di stato");
  const teamsSet = await admin.from("matches").update({ status: "teams_set" }).eq("id", match.id);
  check(
    "non si confermano le squadre con giocatori senza squadra",
    teamsSet.error !== null,
    teamsSet.error?.message,
  );

  /* ---------------- Posizioni ---------------- */

  console.log("\nPosizioni e formati");
  const catalog = await playerClient.from("positions").select("code, format");
  check("il catalogo posizioni è leggibile", (catalog.data ?? []).length >= 20, catalog.error?.message);
  check(
    "il catalogo copre i tre formati",
    new Set((catalog.data ?? []).map((row) => row.format)).size === 3,
  );

  const foreignCatalogWrite = await playerClient
    .from("positions")
    .insert({ code: "x_fake", format: "five_a_side", label: "Finta", short_label: "XX", role_group: "defender", x: 0.5, y: 0.5 })
    .select("code");
  check(
    "il catalogo non si scrive dall'app",
    (foreignCatalogWrite.data ?? []).length === 0,
    foreignCatalogWrite.error?.message,
  );

  const ownPositions = await playerClient
    .from("profile_positions")
    .insert([
      { profile_id: player.id, position_code: "8_gk" },
      { profile_id: player.id, position_code: "5_lat_r" },
    ])
    .select("position_code");
  check(
    "si scelgono le proprie posizioni",
    (ownPositions.data ?? []).length === 2,
    ownPositions.error?.message,
  );

  const foreignPositions = await otherClient
    .from("profile_positions")
    .insert({ profile_id: player.id, position_code: "11_st" })
    .select("position_code");
  check(
    "non si scelgono le posizioni di un altro",
    (foreignPositions.data ?? []).length === 0,
    foreignPositions.error?.message,
  );

  const cachedPositions = await otherClient.from("profile_positions").select("profile_id");
  check("tutti vedono le posizioni dei compagni", (cachedPositions.data ?? []).length >= 2);

  const matchFormat = await admin.from("matches").select("format").eq("id", match.id).single();
  check("la partita ha un formato", matchFormat.data?.format === "eight_a_side", matchFormat.data?.format);

  /* ---------------- Sondaggi ---------------- */

  console.log("\nSondaggi");
  const pollInsert = await playerClient
    .from("polls")
    .insert({
      question: `Sondaggio RLS ${stamp}`,
      allow_multiple: true,
      created_by: player.id,
      week_start: "2026-10-05", // lunedì
    })
    .select("id")
    .single();
  check("un membro crea un sondaggio", Boolean(pollInsert.data?.id), pollInsert.error?.message);

  const pollId = pollInsert.data.id;

  const optionsInsert = await playerClient
    .from("poll_options")
    .insert([
      { poll_id: pollId, label: "Martedì", sort_order: 0 },
      { poll_id: pollId, label: "Giovedì", sort_order: 1 },
    ])
    .select("id, sort_order");
  check("l'autore aggiunge le opzioni", (optionsInsert.data ?? []).length === 2, optionsInsert.error?.message);

  const optionIds = (optionsInsert.data ?? []).map((row) => row.id);

  const foreignVote = await otherClient
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionIds[0], profile_id: player.id })
    .select("id");
  check(
    "non si vota a nome di un altro",
    (foreignVote.data ?? []).length === 0,
    foreignVote.error?.message,
  );

  const ownVote = await otherClient
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionIds[1], profile_id: other.id })
    .select("id")
    .single();
  check("si vota per sé", Boolean(ownVote.data?.id), ownVote.error?.message);

  const weekHijack = await playerClient
    .from("polls")
    .update({ week_start: "2030-01-07" })
    .eq("id", pollId)
    .select("week_start")
    .single();
  check(
    "la settimana non si modifica dopo la creazione",
    weekHijack.data?.week_start === "2026-10-05",
    weekHijack.data?.week_start,
  );

  const badWeek = await playerClient
    .from("polls")
    .insert({ question: `Settimana sbagliata ${stamp}`, created_by: player.id, week_start: "2026-10-07" })
    .select("id");
  check(
    "la settimana deve iniziare di lunedì",
    (badWeek.data ?? []).length === 0,
    badWeek.error?.message,
  );

  const votes = await playerClient.from("poll_votes").select("profile_id, option_id");
  check("tutti vedono chi ha votato cosa", (votes.data ?? []).length >= 1);

  const foreignOption = await otherClient
    .from("poll_options")
    .insert({ poll_id: pollId, label: "Intruso", sort_order: 2 })
    .select("id");
  check(
    "solo l'autore aggiunge opzioni",
    (foreignOption.data ?? []).length === 0,
    foreignOption.error?.message,
  );

  const foreignClose = await otherClient
    .from("polls")
    .update({ is_closed: true })
    .eq("id", pollId)
    .select("id");
  check(
    "solo l'autore (o un admin) chiude il sondaggio",
    (foreignClose.data ?? []).length === 0,
    foreignClose.error?.message,
  );

  const hijack = await playerClient
    .from("polls")
    .update({ question: "Domanda dirottata" })
    .eq("id", pollId)
    .select("question")
    .single();
  check(
    "la domanda non si modifica dopo la creazione",
    hijack.data?.question?.startsWith("Sondaggio RLS"),
    hijack.data?.question,
  );

  await playerClient.from("polls").update({ is_closed: true }).eq("id", pollId);
  const voteOnClosed = await otherClient
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionIds[0], profile_id: other.id })
    .select("id");
  check(
    "non si vota su un sondaggio chiuso",
    (voteOnClosed.data ?? []).length === 0,
    voteOnClosed.error?.message,
  );

  await admin.from("polls").delete().eq("id", pollId);

  // Pulizia
  await admin.from("matches").delete().eq("id", match.id);
} catch (error) {
  failed += 1;
  console.error("\nErrore inatteso:", error.message ?? error);
} finally {
  for (const id of created) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

console.log(`\n${passed} verifiche superate, ${failed} fallite.`);
process.exit(failed === 0 ? 0 : 1);
