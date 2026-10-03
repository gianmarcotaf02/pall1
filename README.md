# Pall1

**Pall1** si legge *pall-one* → **pallone**. Webapp per gestire il calcetto tra amici:
iscrizioni, formazione delle squadre, risultati, classifica e statistiche.

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript strict
- **Dati, auth e storage:** Supabase (Postgres + RLS + Auth email/password + Storage)
- **Deploy:** Vercel (produzione su `main`, preview per ogni PR)
- **UI:** mobile-first, tema chiaro/scuro, design system a token OKLCH

Progetto Supabase: `pall1` · ref `yivbesunamjxdmbczmda` · regione Frankfurt
Progetto Vercel: `pall1` · repo GitHub: `gianmarcotaf02/pall1`

---

## 1. Cose da fare a mano (una volta sola)

Queste operazioni **non sono automatizzabili da CLI** e sono già state evitate/saltate
di proposito. Vanno fatte nel browser.

### 1.1 Eliminare la vecchia organizzazione Supabase `FantaNews`

L'organizzazione `FantaNews` è ormai vuota (i vecchi progetti `fanta360` e
`calcetto-amici` sono già stati eliminati), quindi può essere cancellata.

1. Vai su <https://supabase.com/dashboard/org/ufhthtarxwjbgmiauesy/general>
2. **Settings → General → Delete organization**
3. Conferma.

> La CLI `supabase` non espone `orgs delete`: da riga di comando è impossibile
> (solo `orgs list` e `orgs create`).

### 1.2 URL di autenticazione ✅ già configurati

Site URL e Redirect URLs **sono già impostati** su `https://pall1.vercel.app` e sulla
wildcard delle preview deploy. Il link di conferma email ora porta su Vercel, non più
su `localhost`.

Se in futuro cambi dominio (o aggiungi le preview di un altro team), aggiorna la
sezione `[auth]` di `supabase/config.toml` e ripubblica:

```bash
supabase config push
```

> Attenzione: `config push` invia **tutta** la configurazione auth locale, non solo gli
> URL. La CLI mostra il diff e chiede conferma: leggilo prima di dire sì.

Valori attualmente in `config.toml`:

```toml
[auth]
site_url = "https://pall1.vercel.app"
additional_redirect_urls = [
  "http://localhost:3000/auth/callback",
  "https://pall1.vercel.app/auth/callback",
  "https://*-gianmarcos-projects-860f9848.vercel.app/auth/callback",
]
[auth.email]
enable_confirmations = true
```

Provider: <https://supabase.com/dashboard/project/yivbesunamjxdmbczmda/auth/providers>
(solo **Email**, nessun OAuth).

### 1.3 Primo amministratore ✅ già creato

L'account **`Sabbia`** (`gianmarco.taf02@gmail.com`) è già amministratore, quindi la
voce **Gestione** compare subito nell'app.

Gli altri admin si promuovono da `/admin/players`. Se ti serve farlo direttamente dal
database (SQL Editor di Supabase), sostituendo il nickname:

```sql
update public.profiles
set is_admin = true
where lower(nickname) = lower('nickname_del_giocatore');
```

Nessuna policy permette a un utente di auto-promuoversi.

### 1.4 (Consigliato) Ruotare la password del database

La password attuale è `pall1`: corta e indovinabile. Il progetto è personale, ma prima
di condividere il link è meglio cambiarla da
**Project Settings → Database → Reset database password**.
Se la ruoti, aggiorna il valore usato per `supabase db push` e `npm run test:rls`.

### 1.5 (Opzionale) SMTP personalizzato

Il piano free di Supabase limita l'invio email (~2-4/ora). Se il gruppo cresce,
configura un SMTP tuo (Resend, Brevo, …) in **Auth → SMTP Settings**.

### 1.6 (Opzionale) Secrets per la CI

Il workflow `.github/workflows/ci.yml` esegue anche la build, che richiede le variabili
pubbliche. Aggiungi in **GitHub → Settings → Secrets and variables → Actions**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Sviluppo locale

```bash
npm install
cp .env.example .env.local   # e inserisci URL + anon key reali
npm run dev                  # http://localhost:3000
```

`.env.local` è già presente in questo checkout con i valori veri (ed è git-ignored).

### Variabili d'ambiente

| Variabile | Dove | Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | pubblica |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | pubblica, protetta dalle RLS |
| `NEXT_PUBLIC_SITE_URL` | server | usata per i redirect di auth; in produzione è il dominio Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo locale/CI** | mai nel frontend, mai su Vercel |
| `SUPABASE_PROJECT_ID` | **solo locale/CI** | per `gen:types` |

Su Vercel le due variabili `NEXT_PUBLIC_*` sono già impostate per
Production, Preview e Development.

### Script

| Comando | Cosa fa |
|---|---|
| `npm run dev` | server di sviluppo |
| `npm run build` / `npm start` | build e avvio in produzione |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run typecheck` | TypeScript in modalità `noEmit` |
| `npm test` | test unitari (Vitest) |
| `npm run test:rls` | test delle policy RLS contro il DB reale |
| `npm run test:e2e` | E2E con Playwright (avvia da sé il dev server) |
| `npm run gen:types` | rigenera `src/types/database.types.ts` dal DB |
| `npm run format` | Prettier |

---

## 3. Database

Le migrazioni sono in `supabase/migrations/` e sono già state applicate al progetto
remoto (`supabase migration list` → local = remote).

| Migrazione | Contenuto |
|---|---|
| `…_init_schema` | enum, `profiles`, `matches`, `match_players`, `match_results`, indici |
| `…_functions_triggers` | `is_admin()`, `handle_new_user()`, capienza, transizioni di stato |
| `…_rls_policies` | RLS su tutte le tabelle |
| `…_views_stats` | view `player_stats` e `standings` (`security_invoker`) |
| `…_storage_avatars` | bucket `avatars` + policy |

```bash
supabase link --project-ref yivbesunamjxdmbczmda
supabase db push          # applica le migrazioni nuove
npm run gen:types         # rigenera i tipi TypeScript
```

### Regole di sicurezza in breve

- RLS attiva su **tutte** le tabelle; `anon` non legge nulla.
- `is_admin()` è `security definer`: il ruolo vive nel database, mai nel client.
- Un utente può modificare **solo** il proprio profilo, e i trigger gli impediscono di
  toccare `is_admin` e `is_active`.
- Iscrizione e disiscrizione sono libere (con vincolo di capienza); squadre, gol,
  assist, risultato e MVP sono riservati all'admin.
- Il numero di maglia è unico **tra i giocatori attivi**.
- `played` e `teams_set` sono validati da trigger: non si chiude una partita senza
  risultato, non si confermano le squadre con giocatori non assegnati.

---

## 4. Struttura del progetto

```
src/
├─ app/
│  ├─ (auth)/          login, registrazione, reset password
│  ├─ (app)/           shell autenticata: home, partite, classifica, giocatori, profilo
│  │  └─ admin/        pannello di gestione (solo admin)
│  ├─ auth/callback/   scambio del codice di conferma in sessione
│  └─ globals.css      design system a token (OKLCH)
├─ components/
│  ├─ ui/              primitive: button, field, badge, avatar, empty state
│  ├─ match/           pannello partita, controllo presenza
│  ├─ admin/           form e pannelli di gestione
│  └─ …
├─ lib/
│  ├─ actions/         Server Actions (auth, profilo, iscrizioni, admin)
│  ├─ supabase/        client server-side + refresh in proxy
│  ├─ queries.ts       letture tipizzate
│  ├─ validation/      schemi Zod
│  └─ errors.ts        traduzione errori Postgres/trigger in italiano
├─ proxy.ts            refresh sessione + guardia rotte (ex middleware)
└─ types/              tipi generati dal DB + tipi di dominio
```

---

## 5. Design system

Token definiti in `src/app/globals.css` (Tailwind v4, `@theme inline`):

- **Accento unico**: verde campo (`oklch(50% 0.145 147)` → `#09782b`), usato solo per azioni
  primarie, stato selezionato e focus.
- **Neutri tintati** di verde verso l'accento; nessun `#000` né `#fff`, nessun gradiente.
- **Tipografia**: *Instrument Sans* per l'interfaccia, *Archivo* per titoli e numeri
  (`.num`, cifre tabellari). Scala rem fissa.
- **Semantica**: `win` (verde bosco, distinto dall'accento) / `loss` (rosso) /
  `draw` (ambra), sempre accompagnati da lettere `V · P · S`.
- **Contrasti verificati**: `npm run check:contrast` legge i token da `globals.css` e
  controlla 16 coppie testo/sfondo per tema.
- **Stati**: ogni controllo ha hover, focus-visible, active, disabled, loading, error.
- Tema chiaro/scuro con `prefers-color-scheme` e override manuale in `localStorage`.

---

## 6. Deploy

**Produzione:** <https://pall1.vercel.app>

1. Push su `main` → deploy automatico su Vercel.
2. Ogni PR → preview deploy (usa le stesse variabili `NEXT_PUBLIC_*`).
3. Prima del merge: `npm run lint && npm run typecheck && npm test && npm run build`.

`vercel.json` fissa il framework su `nextjs`: il progetto era stato creato dalla CLI come
framework *Other* (output `public/`), e questo faceva rispondere 404 a tutte le rotte.
La protezione SSO dei deployment è disattivata, altrimenti gli URL `.vercel.app`
richiederebbero il login a Vercel anche per gli amici.

---

## 7. Test

- **Unitari** (`npm test`): schemi Zod, traduzione errori, conversioni di fuso orario.
- **RLS** (`npm run test:rls`): crea utenti di prova con la service role key e verifica
  con la anon key che letture e scritture siano davvero limitate. Pulizia automatica.
- **E2E** (`npm run test:e2e`): flussi di accesso su viewport mobile e desktop.

I test RLS sono la rete di sicurezza più importante: se una policy si allenta, se ne
accorgono loro.
