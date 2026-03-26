# Restaurant Scheduler

A full-stack scheduling application for restaurant workforce management, built as part of the AllieHealth Engineering Challenge.

Manage your team's weekly schedule through a natural language chat interface powered by Google Gemini — no buttons, just conversation.

## Features

- **AI-powered chat** — natural language commands via Google Gemini (structured output, intent recognition, context tracking)
- **Auto-fill** — automatically assigns employees to open slots based on role, availability, skills, and workload balance
- **Schedule board** — visual weekly view with coverage indicators per shift
- **Full schedule operations** — fill, remove, remove & refill, replace assignments
- **Rich queries** — ask about any employee, shift, day, availability, or staffing rule
- **Zero cold start** — `npm run dev` bootstraps the database, seeds 25 employees, generates the current week, and runs autofill automatically

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Express + TypeScript |
| Database | SQLite via `better-sqlite3` |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Shared types | npm workspace package |

## Getting Started

### Prerequisites

- Node.js 18+
- A free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Setup
```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd alliehealth-challenge
npm install

# 2. Create the backend env file
echo "GEMINI_API_KEY=your_key_here" > apps/backend/.env

# 3. Start everything
npm run dev
```

That's it. The app will be available at `http://localhost:5173`.

## Chat Examples

The assistant understands natural language — no specific syntax required.

**Schedule actions:**
```
Fill this week
Fill Monday morning
Remove Fernanda Alves from Monday morning
Remove and refill Bruno Costa from Friday evening
Replace Ana Lima with Bruno Costa on Monday morning
```

**Queries:**
```
Show me this week's schedule
Who is working on Monday?
Show Monday morning shift
List all employees
Show Ana Lima's schedule this week
Is Fernanda Alves available on Tuesday?
What are the staffing rules?
Why is Monday morning understaffed?
```

**Context-aware follow-ups:**
```
> Show Ana Lima's availability
> Remove her from that shift   ← resolves "her" and "that shift" from context
```

## Data Model

The seed includes 25 employees across 5 roles:

| Role | Count |
|---|---|
| Manager | 3 |
| Cook | 5 |
| Waiter | 8 |
| Hostess | 5 |
| Dishwasher | 4 |

Each employee has:
- A role and a set of skills (e.g. `grill`, `wine-service`, `pastry`, `floor-lead`)
- Per-day, per-shift availability
- Off days modeled as `is_available = 0` in the availability table

Staffing rules define how many of each role (and which skills) are required per day and shift. Autofill assigns employees using a greedy algorithm that respects role, availability, skill requirements, and workload balance (fewest shifts first).

## Project Structure
```
.
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── db/          # schema, seed, bootstrap
│   │   │   ├── routes/      # chat, schedule, employees, rules
│   │   │   └── services/    # gemini, chatOrchestrator, autofill, scheduler, swap
│   │   └── .env             # GEMINI_API_KEY (you create this)
│   └── frontend/
│       └── src/
│           ├── api/         # API client
│           └── components/  # ChatBox, ScheduleBoard, DayColumn, ShiftCard
└── packages/
    └── shared/              # shared TypeScript types
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Google AI Studio API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Override the Gemini model |

## Available Scripts
```bash
npm run dev          # bootstrap DB + start frontend & backend
npm run build        # build all packages
npm run db:reset     # wipe and re-seed the database
```
