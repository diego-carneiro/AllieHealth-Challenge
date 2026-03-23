# Restaurant Scheduler

A full-stack scheduling application built for the **AllieHealth Engineering Challenge**.

---

## Overview

Restaurant Scheduler is a workforce scheduling app designed around a restaurant operation, where staffing demand changes across days and shifts.

The application allows an operator to:

- Define staffing needs by day and shift
- Generate real weekly schedule slots from recurring staffing rules
- Auto-fill open schedule slots using worker role, skill, and availability
- Remove, replace, and refill assigned workers
- Control the schedule through a **chat interface**
- View the resulting schedule in a weekly board UI

The project is built with **TypeScript across the stack**, uses **SQLite for local persistence**, and is organized as a **monorepo** for a clean full-stack workflow.

---

## Challenge Alignment

This implementation directly addresses the requested challenge scope.

| Requirement | Implementation |
|---|---|
| TypeScript across the stack | React + TypeScript frontend, Express + TypeScript backend |
| Local persistence | SQLite with `better-sqlite3` |
| UI for viewing schedule/calendar | Weekly schedule board in the frontend |
| Defining a schedule | Recurring staffing rules by day, shift, role, and skill |
| Auto-filling according to rules and availability | Backend scheduling and autofill services |
| Ability to swap out people and fill gaps | Remove / refill / replace flows implemented |
| Chat instead of traditional action controls | Chat interface drives scheduling actions |
| Easy local setup | `npm install` + `npm run dev` |
| GitHub process visibility | Incremental commit history across the build |

---

## Product Scope

The app currently supports:

- Recurring staffing rules by day and shift
- Real weekly slot generation
- Automatic assignment of compatible workers
- Gap handling when no valid worker is available
- Removal of assigned workers
- Replacement of assigned workers
- Refill of open slots
- Chat-driven schedule actions
- Weekly schedule visualization with coverage feedback

---

## Main Features

### 1. Staffing Rules

The system stores recurring staffing requirements such as:

- 1 manager with `opening` skill on Monday morning
- 2 cooks on Friday evening
- 8 waiters on Saturday evening
- 1 hostess with `cashier` skill on Sunday morning

These rules are persisted in SQLite and used to generate weekly shift slots.

### 2. Weekly Schedule Generation

The backend reads the recurring rules and creates real `shift_slots` for an actual calendar week.

This separates:

- Recurring staffing demand
- Real schedule instances for a specific week

### 3. Autofill

Open slots are automatically filled using:

- Role match
- Required skill match, when applicable
- Worker availability by day and shift
- No duplicate assignment in the same shift
- Simple load balancing by preferring workers with fewer assignments

### 4. Remove / Replace / Refill

The scheduling flow supports:

- Removing an assigned worker
- Refilling an open slot
- Removing and immediately attempting refill
- Replacing one worker with another compatible worker

### 5. Chat-First Workflow

Instead of schedule action buttons, the application accepts text commands through a chat box.

### 6. Weekly Schedule Board

The frontend renders:

- One column per day
- Morning and evening sections
- Coverage badges
- Open slots clearly highlighted
- Role-based card styling

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite

### Backend

- Express
- TypeScript
- `tsx`

### Database

- SQLite
- `better-sqlite3`

### Project Organization

- npm workspaces monorepo
- Shared package for common TypeScript types

---

## Project Structure

```
.
├── apps
│   ├── backend
│   │   ├── data
│   │   └── src
│   │       ├── db
│   │       ├── routes
│   │       └── services
│   └── frontend
│       └── src
│           ├── api
│           └── components
├── packages
│   └── shared
└── package.json
```

---

## Data Model

The application uses a relational structure centered around worker eligibility and real schedule slots.

### `employees`

Stores each worker and their main role.

### `employee_skills`

Stores optional worker skills such as: `opening`, `closing`, `cashier`, `grill`, `wine-service`, `floor-lead`.

### `employee_availability`

Stores worker availability by day of week and shift (`morning` or `evening`).

### `schedule_rules`

Stores recurring staffing demand by day of week, shift, role, required skill (optional), and quantity.

### `shift_slots`

Stores the real generated schedule slots for a specific date.

---

## Seed Data

The project includes demo data so the evaluator does not need to create workers manually before testing.

The seed includes:

- 25 employees
- Multiple roles: `manager`, `cook`, `waiter`, `hostess`, `dishwasher`
- Multiple skills
- Availability by day and shift
- Recurring weekly staffing rules for all seven days
- Higher staffing demand on Friday, Saturday, and Sunday

---

## Chat Commands

### Read

```
show schedule
show monday schedule
show employees
show rules
```

### Generation / Autofill

```
fill this week
fill this week starting 2026-03-23
```

### Remove / Refill

```
remove Ana Lima from monday morning
remove and refill Bruno Costa from friday evening
```

### Replace

```
replace Ana Lima with Bruno Costa on monday morning
replace Diego Rocha with Gabriel Souza on thursday evening
```

---

## Demo Flow

1. Install dependencies: `npm install`
2. Run the application: `npm run dev`
3. Open the app:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`
4. Try a few commands in the chat:
   - `show schedule`
   - `show employees`
   - `show monday schedule`
   - `remove Ana Lima from monday morning`
   - `remove and refill Bruno Costa from friday evening`
   - `fill this week`
5. Watch the schedule board update — the frontend refreshes after chat actions, so changes are reflected immediately.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the app
npm run dev
```

Open locally:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## Scripts

### Root

| Script | Description |
|---|---|
| `npm run dev` | Starts the full stack |
| `npm run build` | Compiles all projects |
| `npm run bootstrap-db` | Initial database setup |

### Backend (`apps/backend`)

| Script | Description |
|---|---|
| `npm run dev -w apps/backend` | Dev mode |
| `npm run build -w apps/backend` | Production build |
| `npm run db:init -w apps/backend` | Initialize schema |
| `npm run db:reset -w apps/backend` | Reset database |
| `npm run db:bootstrap -w apps/backend` | Seed database |

### Frontend (`apps/frontend`)

| Script | Description |
|---|---|
| `npm run dev -w apps/frontend` | Dev mode |
| `npm run build -w apps/frontend` | Production build |

---

## Startup Flow

After dependencies are installed, running `npm run dev` automatically:

1. Bootstraps the SQLite database
2. Creates the schema if needed
3. Seeds the database if it is empty
4. Generates the current week if it does not already exist
5. Runs autofill
6. Starts backend and frontend together

This keeps setup friction low for local evaluation.

---

## Scheduling Logic

### Generation

The backend reads `schedule_rules` and creates one `shift_slot` record per required staffing position for the selected week.

### Autofill

For each open slot, the system searches for the best candidate using:

- Matching role
- Matching required skill, if present
- Matching day and shift availability
- No existing assignment in the same shift
- Lowest current assignment count in the target week

### Open Slots

Open slots are intentionally allowed when no worker satisfies all constraints. This reflects a realistic staffing shortage instead of forcing invalid assignments.

---

## UI Summary

The interface is designed for fast review:

- **Weekly schedule layout** — clear daily and shift columns
- **Coverage badges** — visual status: `Complete`, `Partial`, `Empty`
- **Open slots** — visually highlighted
- **Role-based left-border colors** — for faster scanning
- **Chat panel** — located above the schedule board for direct control

---

## Architecture Summary

### Frontend

- Renders the weekly schedule board
- Renders the chat interface
- Sends chat commands to the backend
- Reloads the schedule after actions

### Backend

- Exposes REST endpoints
- Persists and queries scheduling data
- Interprets chat commands
- Generates weekly slots
- Autofills open shifts
- Removes, replaces, and refills assignments

### Shared Package

- Centralizes reusable TypeScript types
- Reduces duplication between frontend and backend contracts

---

## Final Consideration

This project was built to show a practical scheduling workflow end to end: persistent data, real weekly generation, automatic staffing, chat-driven actions, and a UI that makes the result easy to review.
