# AI Dev Tracker

**AI Dev Tracker** is a developer-focused project management web application tailored for software engineers building with AI tools (Claude, ChatGPT, Gemini, Cursor, Lovable, Copilot, v0, etc.).

Conventional issue trackers (Jira, Linear, Trello) assume traditional manual coding workflows. AI Dev Tracker treats the AI development lifecycle as a first-class citizen by combining:
1. An accessible **Kanban board** with milestones, column categories, task checklists, and activity history.
2. An **AI prompt & result log** attached to every task (prompts, outputs, models, outcomes, and tool errors).
3. A **project context briefing page** with single-click session starters to copy into any AI coding session.
4. A project-wide **Prompt Library** to search, filter, and reuse successful prompts.
5. Client-side **Data Export** (JSON, CSV, Markdown) and simulated multi-user organization support.

---

## Quick Start & Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build for production (TypeScript check + Vite production bundle)
npm run build
```

Open `http://localhost:5173` in your browser.

---

## Demo Credentials & Loading Demo Data

### Demo Accounts
| User | Email | Password | Role / Details |
|---|---|---|---|
| **Alex Demo** | `alex@demo.test` | `demo1234` | Owner of "Portfolio Site" (Solo) & "Habit Tracker App" (Team) |
| **Sam Rivera** | `sam@demo.test` | `demo1234` | Member of "Demo Studio" team, Admin on "Habit Tracker App" |

### How to use "Load Demo Data"
You can seed realistic prototype data in two ways:
1. **From the Login Screen (`/login`):**
   - Click the **"Load Demo Data & Login"** button. This automatically seeds realistic projects, tasks, prompts, tool errors, and milestones, then authenticates you as Alex Demo.
2. **From the Dashboard (`/dashboard`):**
   - Click **"Load Demo Data"** in the top action bar at any time to reseed or populate demo data.

---

## Features Walkthrough

### 1. Kanban Board (`/projects/:id/board`)
- **Drag-and-Drop & Keyboard Alternative:** Full drag-and-drop via `@dnd-kit`. Every card also includes an accessible **"Move"** dropdown menu with destination columns for full keyboard operability.
- **Card Metadata:** Title, priority badge (icon + text), assignee avatar & name, milestone chip with countdown ("Due in 10 days", "Overdue by 3 days"), requirements checklist progress (`3/5`), prompt counts, and active tool error badges.
- **Filters & Search:** Real-time text search across titles, descriptions, and notes, combined with multi-parameter filters (priority, assignee, milestone, label). Filter state synchronizes directly with URL query parameters (`?q=...&priority=...`).
- **Custom Columns:** Add new columns, rename, reorder (move left/right), and delete columns with safe task migration to a target column. At least one column is enforced with category `closed`.

### 2. Task Detail Modal (`/projects/:id/tasks/:taskId`)
- **Details:** Edit title, description, priority, assignee, milestone, labels, and column.
- **Definition of Done:** Sub-requirements checklist with toggle, add, and delete.
- **AI Context Briefing:** Specialized task briefing textarea with a **"Copy for AI"** button that compiles project tech stack, task specs, checklists, and the 3 most recent prompt attempts into paste-ready Markdown.
- **Interactive Markdown Notes:** GitHub Flavored Markdown (GFM) editor with live preview. Checklists (`- [ ] item`) in preview are interactively clickable and update the markdown source text.
- **Prompt Log & Revisions:** Log AI attempts with model suggestions (Claude, ChatGPT, Cursor, Lovable, etc.), outcome radio indicators (*Worked*, *Partially worked*, *Failed*), outputs, and notes. Entries can be expanded, copied, edited, and deleted.
- **Tool Error Log:** Log AI tool bugs, stack traces, and resolutions.
- **Team Comments & Activity History:** Full reverse-chronological timeline of task moves, priority changes, and prompt creations.

### 3. Project Context Page (`/projects/:id/context`)
- Manage seven foundational briefing sections: Summary, Tech Stack & Architecture, Functional Requirements, Non-Functional Requirements, Data Requirements, Database Notes, and Extra Session Instructions.
- **Copy Session Starter:** One-click generation and clipboard copy of the entire briefing document with empty sections omitted.
- **Live Output Preview:** Expandable preview displaying the formatted Markdown that will be provided to the AI assistant.
- **Copy Section:** Independent copy buttons on each card to copy isolated requirements blocks.

### 4. Milestone Tracking (`/projects/:id/milestones`)
- Create and manage milestones with due dates, markdown notes, and assigned tasks.
- **Progress Bars:** Accessible progress indicators (`role="progressbar"`, `aria-valuenow`) reflecting closed task completion percentage.
- **Countdowns & Warnings:** Dynamic countdowns ("12 days left", "Due today", "Overdue by 3 days") with prominent warning banners for overdue milestones.
- Milestone summary pages group tasks by workflow status with inline task assignment.

### 5. Prompt Library (`/projects/:id/prompts`)
- Searchable project-wide index of every prompt attempt.
- Filter by outcome (*Worked*, *Partially worked*, *Failed*), model, or free-text search.
- Quick copy buttons to reuse successful prompt engineering patterns across tasks.

### 6. Teams, Permissions & Solo Projects
- **Solo Projects:** Team-specific UI is cleanly hidden for solo projects (`teamId: null`).
- **Teams:** Create teams, invite registered members by email, and manage membership.
- **Role-Based Permissions:** Enforced across Owner, Admin, Member, and Viewer roles. Viewers are restricted to read-only access (edit controls and forms disabled with clear explanations).

### 7. Export (`/projects/:id/settings`)
- **Full Project Export (JSON):** Backs up tasks, milestones, prompts, errors, comments, activity, and context.
- **Tasks Export (CSV & JSON):** Tabular export of task states, assignees, priorities, and checklist completion.
- **Prompts Export (Markdown & JSON):** Formatted developer log of prompts and outputs grouped by task.

---

## Accessibility & Design Standards (WCAG 2.1 AA)

- **No Color-Only Indicators:** Every status (priorities, milestone countdowns, prompt outcomes) couples accessible color palettes with distinct Lucide icons and plain-language text badges.
- **Keyboard Navigation:** Full tab order, visible focus rings (`focus-visible:ring-2`), and a keyboard "Move to…" menu alongside mouse drag-and-drop.
- **Modal Focus Management:** Modals trap Tab/Shift-Tab focus within dialog boundaries, close on Escape, and restore focus to the triggering element.
- **Live Regions:** Screen reader announcements broadcast via an `aria-live="polite"` region for toasts, clipboard copies, and task moves.
- **Semantic Structure:** Skip-to-content landmark link (`#main-content`), valid heading hierarchy (`h1` -> `h2` -> `h3`), and labelled form inputs (`aria-describedby` for errors).
- **Themes & Contrast:** Light and dark modes satisfy WCAG 2.1 AA contrast (4.5:1 text, 3:1 components).

---

## Assumptions & Design Choices

1. **Authentication Security:** In accordance with PRD §2, authentication simulates a client-side environment using salted SHA-256 password hashing via the Web Crypto API (`crypto.subtle`) and persistent browser session storage.
2. **Persistence Layer:** All reads and writes pass through the repository layer in `src/lib/db.ts` utilizing `localStorage` under key `ai-dev-tracker-data`. No external backend server is required.
3. **Multi-User Simulation:** Multiple accounts can be registered and logged into one at a time on the same browser profile.
4. **Interactive Checklist Toggle:** Checkboxes inside the task notes markdown preview map to the corresponding ordinal GFM task checkbox (`- [ ]` vs `- [x]`) in the source text and update automatically.
5. **Column Categories:** Columns are categorized into `open`, `in_progress`, or `closed`. A task is formally considered "completed/closed" when residing in any column with category `closed`.
6. **Stretch Items:** In accordance with PRD instructions, custom color picker stretch items were omitted to prioritize accessible, bulletproof core functionality.
