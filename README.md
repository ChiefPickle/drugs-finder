# Drug Finder — מערכת חיפוש תרופות לרופא

Web app for physicians to search Israel's prescription drug price list, view prices, get AI-generated clinical summaries, build prescriptions, and sync data across devices.

## Features

- **Search** — fuzzy search by drug name, manufacturer, or formulary codes (~3,650 drugs)
- **Price table** — name, price incl. VAT, manufacturer, package size
- **AI drug info** — Hebrew/English summaries via OpenAI or Claude (auto-detected)
- **Favorites** — star frequently used drugs; sync when logged in
- **Doctor accounts** — register/login to sync favorites and prescriptions across devices
- **Prescription builder** — add drugs, instructions, quantities; print/PDF or export JSON
- **Language toggle** — Hebrew (RTL) ↔ English (LTR)
- **Offline PWA** — installable app; search works offline after first load (AI needs network)

## Setup

```bash
npm install
npm run import-drugs
cp .env.example .env.local
```

Edit `.env.local`:

```env
AUTH_SECRET=your-long-random-secret
OPENAI_API_KEY=sk-...          # or ANTHROPIC_API_KEY
# LLM_PROVIDER=anthropic       # optional: force Claude or openai
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

| Tab | Purpose |
|-----|---------|
| **Search** | Find drugs, view AI info, star favorites, add to prescription |
| **Favorites** | Quick access to starred drugs |
| **Prescription** | Build, print, export, or clear a prescription draft |

Sign in with **התחברות** to sync favorites and prescriptions to the server (SQLite in `.data/app.db`).

Toggle **English / עברית** in the header. Install the app via the browser install prompt (PWA).

## Updating the drug list

```bash
npm run import-drugs
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Required for login sessions |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) API key |
| `LLM_PROVIDER` | Optional: `openai` or `anthropic` |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `ANTHROPIC_MODEL` | Default `claude-sonnet-4-20250514` |
| `DRUGS_XLSX_PATH` | Path to Excel price list |

## Notes

- AI summaries are cached under `.cache/drug-info/`
- Favorites work locally without login; login merges local + server data
- Medical info is for reference only, not a substitute for clinical judgment
