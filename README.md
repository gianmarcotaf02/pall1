# Pall1

**Pall1** si legge *pall-one* → **pallone**. Webapp per gestire il calcetto tra amici:
iscrizioni, formazione delle squadre, risultati, classifica e statistiche.

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript strict
- **Dati, auth e storage:** Supabase (Postgres + RLS + Auth email/password + Storage)
- **Deploy:** Vercel (produzione su `main`, preview per ogni PR)
- **UI:** mobile-first, tema chiaro/scuro, design system a token OKLCH

Progetto Supabase: `pall1` · ref `yivbesunamjxdmbczmda` · regione Frankfurt
Progetto Vercel: `pall1` · repo GitHub: `gianmarcotaf02/pall1`

## Cosa fa

- **Partite:** l'admin crea data, campo e posti; ognuno conferma *Ci sono / Forse / Non ci sono*.
  Capienza rispettata dal database, non dall'interfaccia.
- **Squadre:** assegnazione manuale o **bilanciamento automatico** (portieri divisi, poi riempimento).
- **Risultato:** punteggio, gol, assist e MVP; la chiusura della partita alimenta le statistiche.
- **Sondaggi** (stile WhatsApp): domanda + opzioni, a scelta singola o multipla, con **chi ha
  votato cosa visibile a tutti**; chiudi, riapri o elimina i tuoi. Le opzioni possono portare una
  data e ora, così l'admin crea la partita con un click.
- **Settimane reali**: un sondaggio può riferirsi a una settimana (lunedì → sabato). Scegliendola,
  le opzioni diventano i suoi giorni con la data vera e **ogni giorno ha il suo sottosondaggio sugli
  orari** (feriali 18:00–21:00, sabato 15:30–18:30, ogni 30 minuti); i sondaggi aperti si raggruppano
  per settimana, dalla più vicina a oggi.
- **Notifiche Telegram**: chi vuole attiva il collegamento dal profilo con un tocco (si apre il bot,
  si preme *Start*); da quel momento riceve un messaggio quando nasce una **nuova partita** o un
  **nuovo sondaggio**, con **chi l'ha creato** e — per le partite — **giorno, ora, campo e formato**.
  Arriva anche il **promemoria ~12 ore prima** della partita e un avviso quando qualcuno **dà
  forfait**, solo ai compagni di quella partita. Può mettere in pausa o scollegare quando vuole.
- **Organizzatori**: l'admin può dare a un giocatore il "consenso" da `/admin/players`. Un
  organizzatore può **creare partite**, ma non toccare iscritti, squadre, risultati o profili:
  quelle restano cose da admin. Il permesso vive nel database e non è auto-assegnabile.
- **Presenze a due scelte**: sotto la partita si conferma o si dà forfait (*Foldo, sono un
  infame*). Chi dà forfait avvisa su Telegram i compagni di quella specifica partita.
- **Formati e posizioni:** ogni partita è *calcetto (a 5)*, *calciotto (a 8)* o *calcio a 11*.
  Nel profilo si scelgono le **posizioni preferite per ogni formato toccandole su un campo 2D**
  (uno o più ruoli per formato); l'admin le vede mentre forma le squadre.
- **Chat di gruppo:** una chat unica per tutti, con aggiornamenti **in tempo reale**
  (Supabase Realtime). Ogni messaggio mostra autore e ora, i giorni sono separati e il proprio
  messaggio si può eliminare; un admin modera qualsiasi messaggio. Se il realtime salta, la chat
  si riconcilia da sola ogni 30 secondi.
- **Statistiche:** classifica e tabella per giocatore, calcolate in SQL.
- **Profilo:** nickname unico, posizioni preferite per formato, numero di maglia, avatar.

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

### 1.7 Bot Telegram per le notifiche

Serve un bot: due minuti su [@BotFather](https://t.me/BotFather).

1. `/newbot` → nome e username (es. `Pall1Bot`). Conserva il **token**.
2. Inventa un `TELEGRAM_WEBHOOK_SECRET` a caso (es. `openssl rand -hex 32`). Non è il
   token: è una password che Telegram rimanda in ogni chiamata, così il webhook scarta
   chi non è Telegram.
3. Metti le tre variabili in `.env.local` **e su Vercel** (vedi §2):
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (senza `@`), `TELEGRAM_WEBHOOK_SECRET`.
   Su Vercel aggiungi anche `SUPABASE_SERVICE_ROLE_KEY`, altrimenti il webhook e l'invio
   non funzionano (resta comunque solo lato server).
4. Registra il webhook puntandolo al dominio pubblico:

   ```bash
   npm run telegram:webhook -- set https://pall1.vercel.app
   # verifica:  npm run telegram:webhook -- info
   # rimozione: npm run telegram:webhook -- delete
   ```

Da quel momento, nel profilo compare **Collega Telegram**: genera un codice monouso, apre
il bot con `/start <codice>`, e il webhook abbina la chat al profilo. L'utente non digita
niente. In chat `/start` riattiva le notifiche, `/stop` le mette in pausa.

I bottoni delle notifiche passano da `/open?to=…`: un bottone `url` di un bot apre **sempre**
nel browser interno di Telegram e non c'è parametro per cambiarlo. La pagina-ponte reindirizza
subito chi non è su Telegram mobile; a chi lo è offre l'uscita verso il browser del telefono
(`Telegram.WebApp.openLink()` dentro una Mini App, `intent://` su Android, istruzioni su iOS,
dove una pagina web non può forzare Safari).

### 1.8 Promemoria partita ~12 ore prima

Non usa i cron di Vercel: sul piano **Hobby** il minimo è **una volta al giorno** (la
precisione è per ora, ±59 min), troppo grossolano per un promemoria a 12 ore. Il timer vive
in Postgres: **`pg_cron`** scatta ogni 30 minuti e **`pg_net`** chiama
`/api/cron/match-reminders`, che manda il messaggio e segna `matches.reminder_sent_at`
(così una partita si avvisa una volta sola).

È tutto dentro la migrazione `…_match_reminders`, quindi non c'è niente da configurare a mano.
Per controllare il job:

```sql
select jobname, schedule, active from cron.job;
select * from net._http_response order by created desc limit 5;  -- esiti delle chiamate
```

> Se cambi dominio, aggiorna l'URL dentro il job `pall1-match-reminders` (è nel corpo della
> migrazione `…_match_reminders`) e riprogrammalo con `cron.schedule`.

---

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
| `NEXT_PUBLIC_SITE_URL` | server | usata per i redirect di auth e per i link nelle notifiche; in produzione è il dominio Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo server** (locale, CI e Vercel) | bypassa la RLS: mai nel frontend, mai con prefisso `NEXT_PUBLIC_` |
| `SUPABASE_PROJECT_ID` | **solo locale/CI** | per `gen:types` |
| `TELEGRAM_BOT_TOKEN` | **solo server** | token del bot, da BotFather |
| `TELEGRAM_BOT_USERNAME` | solo server | username del bot senza `@`, serve al deep-link |
| `TELEGRAM_WEBHOOK_SECRET` | **solo server** | stringa casuale: Telegram la rimanda nell'header del webhook |
| `CRON_SECRET` | **solo server**, opzionale | se impostato, l'endpoint dei promemoria richiede `Authorization: Bearer <secret>` |

Su Vercel sono già impostate le due `NEXT_PUBLIC_*`. Vanno aggiunte **a mano** anche
`SUPABASE_SERVICE_ROLE_KEY` e le tre `TELEGRAM_*` (§1.7), per Production e Preview.

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
| `npm run build:brand` | rigenera favicon, icone app e immagine di condivisione (vedi §5, Marchio) |
| `npm run telegram:webhook` | registra/speziona/rimuove il webhook del bot (`-- set <url>`) |
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
| `…_polls` | `polls`, `poll_options`, `poll_votes` + trigger + RLS |
| `…_poll_options_sort_order` | rinomina `position` → `sort_order` (parola riservata SQL + attrito PostgREST) |
| `…_poll_week` | `polls.week_start` (lunedì, opzionale) + vincolo e indice |
| `…_poll_subpolls` | `polls.parent_option_id`: un giorno può avere il suo sottosondaggio orari |
| `…_telegram_notifications` | `telegram_subscribers` + `telegram_link_codes` + RLS per le notifiche Telegram |
| `…_match_reminders` | `matches.reminder_sent_at` + job `pg_cron`/`pg_net` ogni 30 min |
| `…_organizers` | `profiles.is_organizer` + `is_organizer()` + policy di insert sulle partite |
| `…_match_insert_author` | chi crea una partita se la intesta (`created_by = auth.uid()`) |
| `…_formats_and_positions` | `match_format`, catalogo `positions` (25 posizioni su 3 formati + coordinate), `profile_positions`, `matches.format`; elimina i vecchi `roles`/`preferred_role` |
| `…_chat` | `chat_messages` + RLS (lettura a tutti, scrittura a nome proprio, delete proprio/admin) + realtime |

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
- **Sondaggi:** chiunque può crearne uno; ognuno vota solo per sé e solo su sondaggi aperti;
  tutti vedono chi ha votato cosa; domanda e tipo di voto non si modificano dopo la creazione
  (invaliderebbero i voti); l'autore o un admin chiude e cancella.
- I sondaggi-settimana includono lunedì–sabato (niente domenica); ogni giorno genera un sottosondaggio
  orari con gli orari proposti per quel giorno, votabile in linea come un sondaggio normale.
- Un sondaggio a scelta singola sostituisce automaticamente il voto precedente (trigger).
- **Posizioni:** il catalogo `positions` è di sola lettura dall'app; ognuno scrive solo le proprie
  `profile_positions`, tutti le vedono.
- **Settimana:** `week_start` accetta solo lunedì (vincolo) e non si modifica dopo la creazione
  (trigger), come domanda e tipo di voto.
- **Telegram:** le chat si iscrivono solo dal webhook (service role); l'utente vede, mette in pausa
  o cancella **solo la propria** riga; i codici di collegamento sono monouso, scadono e non sono
  leggibili dal client.
- **Organizzatori:** `is_organizer` non è auto-assegnabile (trigger, come `is_admin`); possono solo
  **inserire** partite, intestandosele, e niente altro.
- **Chat:** si legge e si scrive solo da autenticati, e solo a nome proprio; un messaggio non si
  modifica mai, si elimina (solo il proprio, o qualsiasi se l'utente è admin). La tabella è nella
  publication `supabase_realtime`, così gli eventi sono filtrati dalla stessa RLS.

---

## 4. Struttura del progetto

```
src/
├─ app/
│  ├─ (auth)/          login, registrazione, reset password
│  ├─ (app)/           shell autenticata: home, partite, chat, giocatori, profilo
│  │  ├─ chat/         chat di gruppo in tempo reale
│  │  ├─ polls/        sondaggi: elenco, dettaglio, nuovo
│  │  └─ admin/        pannello di gestione (solo admin)
│  ├─ auth/callback/   scambio del codice di conferma in sessione
│  ├─ api/telegram/    webhook del bot + redirect di collegamento
│  ├─ open/            pagina-ponte per aprire i link nel browser del telefono
│  └─ globals.css      design system a token (OKLCH)
├─ components/
│  ├─ ui/              primitive: button, field, badge, avatar, empty state
│  ├─ match/           pannello partita, controllo presenza
│  ├─ positions/       campo 2D, selettore posizioni, pastiglie
│  ├─ chat/            stanza di gruppo, bolle, invio ed eliminazione
│  ├─ polls/           card, risultati cliccabili, form di creazione
│  ├─ profile/         dati giocatore, avatar, collegamento Telegram
│  ├─ admin/           form e pannelli di gestione
│  └─ …
├─ lib/
│  ├─ actions/         Server Actions (auth, profilo, iscrizioni, sondaggi, telegram, admin)
│  ├─ supabase/        client server-side, client browser (Realtime), client service-role, refresh in proxy
│  ├─ queries.ts       letture tipizzate
│  ├─ positions.ts     catalogo posizioni + coordinate (rispecchia la tabella `positions`)
│  ├─ week.ts          settimane lunedì→domenica, fuso di Roma, etichette
│  ├─ poll-times.ts    orari dei sottosondaggi (feriali 18–21, sabato 15:30–18:30)
│  ├─ telegram.ts      invio messaggi e notifiche di dominio
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

### Marchio

Il logo è il numero **1** costruito come un campo da calcio: pallone in alto, linea di metà campo
con cerchio di centrocampo, arco di rigore, base a tre elementi (area di porta) e bandierina
staccata da una tacca.

La forma di riferimento è `docs/logo/riferimento.jpg`: i tracciati SVG **non sono disegnati a
mano**, sono generati con potrace da quell'immagine (`scripts/trace-logo.py`), così il marchio è
esattamente quella forma e resta nitido a ogni dimensione.

**Fuori dall'app il marchio è sempre lo stesso che sta in alto a sinistra in pagina**: favicon,
icona della home e immagine di condivisione non hanno una versione "invertita" (crema su tassello
verde), nascono dagli stessi tracciati e dagli stessi token di colore dell'app. `scripts/brand.mjs`
legge `logo-paths.json` e `--paper`/`--accent` da `globals.css`, quindi non esiste un hex scritto a
mano che possa restare indietro.

| File | Uso |
|---|---|
| `src/components/brand/logo-paths.json` | i tracciati (`hull`, `markings`), generati |
| `src/components/brand/logo-mark.tsx` | il marchio come componente React (in pagina) |
| `public/logo.svg` | marchio isolato, `currentColor` + crema, per qualunque fondo |
| `src/app/icon.svg` | favicon: marchio su fondo trasparente, segue il tema del browser |
| `src/app/favicon.ico` | 16 / 32 / 48 px, per i browser senza favicon SVG |
| `src/app/apple-icon.png` | icona iOS, tassello carta |
| `public/icons/icon-192.png`, `icon-512.png` | icona PWA (tassello carta + marchio) |
| `public/icons/icon-maskable-512.png` | maskable: fondo pieno, marchio nel cerchio sicuro |
| `public/icons/bot-avatar*.png` | foto profilo del bot Telegram |
| `src/app/opengraph-image.png` | anteprima del link condiviso (1200×630) + `.alt.txt` |

Come è composto il disegno, e perché così regge su ogni fondo:

- `hull` è la **sagoma piena** (marcature comprese) e prende il colore del tema (`currentColor`).
- `markings` è pallone e marcature del campo, dipinti **sopra** la sagoma in crema fisso
  (`#f5fcf6`). Il crema non segue il tema: se seguisse il colore della pagina, in tema scuro
  pallone e cerchio di centrocampo diventerebbero neri e il marchio sembrerebbe bucherellato.
- la **tacca della bandierina** è un vuoto vero nella sagoma (la punta è un pezzo staccato):
  lascia vedere il fondo, come nel riferimento, senza bisogno di maschere SVG né di forme
  colorate "a imitazione" del fondo.
- nei tasselli (icona PWA, iOS, Telegram) il fondo è la **carta** dell'app, non il verde: così
  l'icona è il marchio come lo si vede in pagina. Solo l'icona `maskable` ha il fondo pieno, che
  i launcher pretendono, e lì il marchio è rimpicciolito fino a stare nel cerchio sicuro.

Dove il marchio poggia sul fondo pagina serve `text-accent` sul componente: la sagoma è
`currentColor`, quindi senza quella classe eredita il colore del testo ed esce bianca in tema
scuro.

```bash
npm run logo:trace     # rigenera i tracciati dal riferimento (serve python + potracer)
npm run build:brand    # rigenera favicon, icone app e immagine di condivisione
npm run logo:preview   # controlla a occhio le varie dimensioni, su fondo chiaro e scuro
```

> Nota: i tracciati sono dati, non geometria scritta a mano. Per cambiarli si modifica
> `docs/logo/riferimento.jpg` e si rilancia `npm run logo:trace` (riscrive `logo-paths.json` e
> `public/logo.svg`) e poi `npm run build:brand` (riscrive tutti gli asset raster). Se uno dei due
> passi non viene rifatto, `build:icons` si ferma invece di generare icone che non somigliano più
> al marchio.

**Anteprima dei link condivisi.** `layout.tsx` dichiara `metadataBase` (da `NEXT_PUBLIC_SITE_URL`)
e i titoli `openGraph`/`twitter`; l'immagine, le sue dimensioni e l'alt text li prende Next dalle
convenzioni in `src/app/` (`opengraph-image.png`, `opengraph-image.alt.txt`), così vale per tutte le
pagine senza doverli ripetere.

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

- **Unitari** (`npm test`): schemi Zod, traduzione errori, conversioni di fuso orario e
  **coerenza del catalogo posizioni** con la migrazione SQL (codici, etichette, coordinate,
  e nessun pallino sovrapposto sul campo) e **settimane reali** (lunedì, fuso di Roma,
  ora legale, etichette).
- **RLS** (`npm run test:rls`): crea utenti di prova con la service role key e verifica
  con la anon key che letture e scritture siano davvero limitate (32 controlli: partite,
  iscrizioni, sondaggi, posizioni, settimane). Pulizia automatica.
- **E2E** (`npm run test:e2e`): flussi di accesso su viewport mobile e desktop.

I test RLS sono la rete di sicurezza più importante: se una policy si allenta, se ne
accorgono loro.
