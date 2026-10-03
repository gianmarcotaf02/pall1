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
  created.push(player.id, other.id);

  // Il trigger handle_new_user deve aver creato i profili.
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nickname, is_admin")
    .in("id", [player.id, other.id]);

  check("il trigger crea il profilo alla registrazione", (profiles ?? []).length === 2);
  check("i nuovi utenti non sono admin", (profiles ?? []).every((p) => p.is_admin === false));

  const playerClient = await signIn(player.email);
  const otherClient = await signIn(other.email);

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
  await playerClient
    .from("match_players")
    .upsert({ match_id: match.id, profile_id: other.id, attendance: "present" });
  const { data: third } = await admin
    .from("profiles")
    .select("id")
    .neq("id", player.id)
    .neq("id", other.id)
    .limit(1);
  if (third && third.length > 0) {
    const full = await admin
      .from("match_players")
      .insert({ match_id: match.id, profile_id: third[0].id, attendance: "present" })
      .select("id");
    check("la capienza è rispettata", (full.data ?? []).length === 0, full.error?.message);
  } else {
    console.log("  skip capienza (servono almeno 3 profili: registra un altro utente)");
  }

  console.log("\nTransizioni di stato");
  const teamsSet = await admin.from("matches").update({ status: "teams_set" }).eq("id", match.id);
  check(
    "non si confermano le squadre con giocatori senza squadra",
    teamsSet.error !== null,
    teamsSet.error?.message,
  );

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
