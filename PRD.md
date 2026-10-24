# AI Dev Tracker: Product Requirements Document (Prototype)

> **Instructions to the building LLM:** Build the complete prototype described below in one pass. Follow the "Decisions" section exactly. Do not ask clarifying questions; where something is ambiguous, use the stated default. Deliver a runnable project with a README containing setup steps. Prioritise: (1) everything works end to end, (2) accessibility, (3) polish. Anything marked **[STRETCH]** is built only after all else works.

---

## 1. Summary

**AI Dev Tracker** is a project management web app for developers who build software *with AI tools* (Claude, ChatGPT, Cursor, Lovable, Replit, etc.). Conventional trackers (Jira, Linear, Trello) do not model the way AI-assisted work really happens: a task is solved through a loop of prompts, results, failures and retries, and the AI needs good project context to be useful.

This app combines three things:

1. A **Kanban board** with milestones, filters and activity history.
2. A **prompt and result log** attached to every task (what was asked, what came back, did it work).
3. A **project context page** with copy-ready briefing text to paste at the start of any AI session.

It supports solo projects and team projects, and is a **prototype to demonstrate functionality**, not a production system.

### Target users
- **Primary:** small teams or organisations doing the same.
- **Secondary:** a solo developer using AI tools to build software.

---

## 2. Decisions (resolved; do not deviate)

| Topic | Decision |
|---|---|
| Framework | **React 18 + Vite + TypeScript**, **Tailwind CSS**, **React Router**, **@dnd-kit** (drag and drop, with keyboard sensor), **react-markdown + remark-gfm** (markdown and checklists), **date-fns**, **uuid** (or `crypto.randomUUID()`), **lucide-react** (icons). |
| Persistence | **localStorage**, accessed only through a repository/service layer (`src/lib/db.ts`) so a real backend could replace it later. No backend server. Multi-user is simulated within one browser: several accounts can be registered and logged in one at a time. |
| Auth | Email + password. Register, login, logout, persistent session. Passwords stored as a salted SHA-256 hash via `crypto.subtle` (never plain text). Security is deliberately basic. |
| Columns | Default columns are **To Do, In Progress, Review, Done**. Users can add, rename, reorder and delete columns. Each column has a `category` (`open`, `in_progress`, `closed`) so that "closed" is well defined for progress counts (see 5.1). |
| Priority | `low`, `medium`, `high`. |
| Solo projects | A project may have **no team** (`teamId: null`) and then has only its owner as a member. All team UI must be optional and hidden or collapsed for solo projects. |
| Layout | Desktop first, but usable at tablet widths. Full mobile polish is out of scope. |
| Dark mode | Yes. Tailwind `dark:` class strategy, toggle in the header, defaults to system preference, saved per user. |
| Seed data | On first load, offer a "Load demo data" button that creates a demo user, a team, a solo project and a team project with realistic tasks, prompts and milestones. |
| Out of scope | Real GitHub OAuth or API, real-time collaboration, email sending, password reset, billing, mobile apps, a real server. |

---

## 3. Design and accessibility principles

Accessibility is a **first-class requirement**, not a polish item.

1. **Never use colour alone to convey information.** Every colour-coded state must also have an icon and/or a text label:
   - Priority: icon + text ("High", "Medium", "Low") plus colour.
   - Overdue / due soon / on track: icon + text ("Overdue by 3 days", "Due in 2 days") plus colour.
   - Prompt entry outcome: icon + text ("Worked", "Partially worked", "Failed") plus colour.
   - Column category: label text.
2. **Keyboard operable everywhere.** Drag-and-drop must have a keyboard alternative: each card has a "Move to…" menu (a button opening a list of columns) in addition to dnd-kit's keyboard sensor. Modals trap focus and close on Escape, returning focus to the trigger.
3. **Semantic HTML and ARIA.** Use landmarks (`header`, `nav`, `main`), proper headings order, labelled form fields, `aria-live="polite"` regions for toasts and move announcements ("Task 'X' moved to Review"), `aria-current` on active nav.
4. **Contrast.** Meet WCAG 2.1 AA (4.5:1 text, 3:1 UI components) in both light and dark mode. Visible focus ring on all interactive elements.
5. **Respect `prefers-reduced-motion`** (disable non-essential animation).
6. **Colour-blind safe palette.** Use a palette that remains distinguishable (for example blue, orange, purple, teal) and never rely on red vs green alone.
7. **Clear, plain-language UI copy.** Errors say what happened and how to fix it. Form errors are tied to fields with `aria-describedby`.
8. **[STRETCH] Custom milestone colours**, chosen from a curated accessible palette (not a free colour picker), always accompanied by text and icon indicators.

Visual style: clean, calm, developer-tool feel. Neutral background, one accent colour, rounded cards, generous spacing, monospace font for prompts, results, and code.

---

## 4. Data model

Define as TypeScript types in `src/types.ts`. All IDs are strings (UUID). All timestamps are ISO 8601 strings. Dates without time are `YYYY-MM-DD`.

```ts
type Role = 'owner' | 'admin' | 'member' | 'viewer';

interface User {
  id: string;
  name: string;
  email: string;            // unique, lowercase
  passwordHash: string;
  passwordSalt: string;
  githubUsername: string | null;   // user links this manually in profile
  teamIds: string[];
  theme: 'system' | 'light' | 'dark';
  createdAt: string;
}

interface Team {                    // an organisation / team
  id: string;
  name: string;
  memberIds: string[];             // users in the team
  ownerId: string;
  createdAt: string;
}

interface ProjectMember {
  userId: string;
  role: Role;
}

interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string | null;           // null = solo project
  ownerId: string;
  members: ProjectMember[];        // always includes the owner
  columns: Column[];
  labels: string[];                // project-wide label vocabulary
  context: ProjectContext;
  createdAt: string;
}

interface Column {
  id: string;
  name: string;
  category: 'open' | 'in_progress' | 'closed';
  order: number;
}

interface ProjectContext {
  summary: string;                 // project summary
  techStack: string;
  functionalRequirements: string;  // markdown
  nonFunctionalRequirements: string;
  dataRequirements: string;
  databaseNotes: string;
  extraNotes: string;
  updatedAt: string | null;
}

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  notes: string;                   // markdown
  dueDate: string;                 // YYYY-MM-DD
  color: string | null;            // [STRETCH] key from the accessible palette
  createdAt: string;
}

interface Task {
  id: string;
  projectId: string;
  columnId: string;
  order: number;                   // position within the column
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigneeId: string | null;       // a project member
  milestoneId: string | null;
  labels: string[];
  notes: string;                   // markdown; supports GFM checklists (- [ ] item)
  requirements: Requirement[];     // sub-requirements: what "done" means for this task
  aiContext: string;               // task-specific briefing to give an AI tool
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Requirement {
  id: string;
  text: string;
  done: boolean;
}

interface PromptEntry {            // one prompt attempt on a task
  id: string;
  taskId: string;
  promptText: string;
  resultText: string;
  model: string;                   // e.g. "Claude Sonnet", "GPT-5", "Cursor (auto)"; free text with suggestions
  outcome: 'worked' | 'partial' | 'failed';
  outcomeNotes: string;
  createdBy: string;
  createdAt: string;               // timestamp, set automatically
}

interface ToolError {              // errors an AI tool caused or hit during development
  id: string;
  taskId: string;
  tool: string;                    // e.g. "Cursor", "Lovable"
  errorText: string;               // error message or stack trace
  description: string;             // what happened / what was being attempted
  resolved: boolean;
  resolution: string;
  createdBy: string;
  createdAt: string;
}

interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;                    // markdown
  createdAt: string;
}

interface ActivityEvent {
  id: string;
  taskId: string;
  actorId: string;
  type: 'created' | 'moved' | 'priority_changed' | 'milestone_changed'
      | 'assignee_changed' | 'notes_changed' | 'prompt_added' | 'error_logged';
  from: string | null;             // human readable previous value
  to: string | null;               // human readable new value
  createdAt: string;
}
```

---

## 5. Features and acceptance criteria

### 5.1 Kanban board (`/projects/:projectId/board`)

- Columns rendered left to right by `order`. Defaults: **To Do** (open), **In Progress** (in_progress), **Review** (in_progress), **Done** (closed).
- **Drag and drop** cards between and within columns (dnd-kit). The new column and order persist. Moving a card logs a `moved` activity event.
- **Keyboard alternative:** each card has a "Move to…" button with a menu of columns.
- **Card** shows: title, priority badge (icon + text), assignee avatar (initials) and name, milestone chip with due date, labels, checklist progress (e.g. "3/5 requirements"), and counts for prompts and logged errors.
- **Quick add:** an "Add task" input at the bottom of each column. Typing a title and pressing Enter creates the task in that column with defaults (priority medium, unassigned).
- **Custom columns:** "Add column" button; each column has a menu to rename, change category, move left/right, and delete. Deleting a non-empty column requires choosing a column to move its tasks to. At least one column must always exist, and at least one must have category `closed`.
- **Filter and search bar:** free-text search (title, description, notes), plus filters for assignee, priority, milestone and label. Multiple filters combine with AND. A "Clear filters" button and a visible result count. Filters persist in the URL query string.
- Empty states have helpful text and a call-to-action.
- **"Closed" definition:** a task is closed when its column's category is `closed`. This is used for all milestone progress and dashboard stats.

### 5.2 Task detail (opens as a side panel or modal over the board, also routable at `/projects/:projectId/tasks/:taskId`)

Sections, as tabs or a clear vertical layout:

1. **Details:** edit title, description, priority, assignee, milestone, labels, column.
2. **Requirements and context:**
   - **Sub-requirements checklist** (add, tick, delete, reorder optional).
   - **AI context** textarea: the briefing for this task.
   - **Copy task as AI prompt context** button: copies markdown to clipboard containing the project summary and tech stack, the task title, description, requirements, task AI context and notes, and the last 3 prompt entries with outcomes. Shows a toast confirmation announced via `aria-live`.
3. **Notes:** markdown editor with Edit / Preview toggle. Preview renders GFM including interactive checklists (clicking a checkbox in preview updates the note text). Changes to notes log a `notes_changed` activity event (debounced, not per keystroke).
4. **Prompts and results** (see 5.3).
5. **Tool errors:** list and add errors that AI tools produced during development (tool, error text, description, resolved toggle, resolution note). Unresolved errors show a count badge on the card.
6. **Comments:** team comments with author and timestamp; markdown supported. Shown only when the project has more than one member, but allowed for solo projects too (as personal notes) if simple.
7. **Activity history:** reverse chronological list of events: priority changes, milestone changes, notes changes, moves, assignee changes, prompts added, errors logged, each with actor, from, to, and timestamp.

Deleting a task asks for confirmation and removes its prompts, errors, comments and activity.

### 5.3 Prompt and result tracking

- On a task, **"Add prompt entry"** opens a form with: prompt text (multi-line, monospace), result text (multi-line, monospace), model (text input with datalist suggestions: Claude, ChatGPT, Gemini, Cursor, Lovable, Replit, v0, Copilot, Other), outcome (radio group: Worked / Partially worked / Failed), outcome notes. Timestamp is set automatically.
- Entries listed newest first with: model, timestamp, outcome badge (icon + text), collapsible prompt and result with a "Copy prompt" button.
- Entries can be edited (outcome and notes especially) and deleted.
- A project-wide **Prompt Library** page (`/projects/:projectId/prompts`) lists all entries across tasks with search and filters (outcome, model, task), so successful prompts can be reused.

### 5.4 Project context page (`/projects/:projectId/context`)

- Editable fields matching `ProjectContext`: project summary, tech stack, functional requirements, non-functional requirements, data requirements, database notes, extra notes. Markdown allowed. Auto-save with a "Saved" indicator.
- **"Copy session starter"** button: generates a single markdown block (headings per section, empty sections omitted) and copies it to the clipboard, with a preview panel showing exactly what will be copied. Also a "Copy single section" button on each section.
- Intended use: paste at the start of a session with any AI tool.

### 5.5 Milestones (`/projects/:projectId/milestones`)

- Create, edit, delete milestones: title, notes (markdown), due date.
- Assign tasks to a milestone from the task detail, and from the milestone page ("Add existing tasks").
- **Progress indicator:** text "6 of 10 tasks closed" plus a progress bar (with `role="progressbar"`, `aria-valuenow`, etc). Milestones with no tasks show "No tasks yet".
- **Countdown:** days remaining ("12 days left", "Due today", "Overdue by 3 days").
- **Overdue warning:** if due date passed and not all tasks are closed, show a warning banner with icon and text (never colour alone). Overdue milestones are flagged in the milestone list and in the dashboard.
- Milestone summary page (`/projects/:projectId/milestones/:milestoneId`): countdown, progress, notes, and the task list grouped by column with status.
- **[STRETCH]** Choose a milestone colour from an accessible palette; used for chips and countdown styling alongside text and icons.

### 5.6 Users, teams, projects and permissions

- **Register** (name, email, password, optional team name to create; optional GitHub username), **login**, **logout**. Session persists across reloads. Basic validation (valid email, password at least 8 characters, unique email).
- **Profile page:** edit name, GitHub username (displayed as a link to `https://github.com/<username>`, no verification), theme, change password.
- **Teams:** create a team; add members by the email of an **existing registered user**; remove members; a user may belong to several teams. Team page lists members.
- **Projects:** a user can have many projects. Create a project as **solo** (no team) or **under a team**. The project list shows both, grouped. Switch projects from a header dropdown.
- **Project members:** add members to a project (from the team, or any registered user by email for solo projects) with a role.
- **Roles and permissions (project level):**

| Action | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| View everything | yes | yes | yes | yes |
| Create and edit tasks, prompts, errors, notes | yes | yes | yes | no |
| Comment | yes | yes | yes | yes |
| Manage columns, milestones, context | yes | yes | no | no |
| Manage members and roles | yes | yes | no | no |
| Delete project, transfer ownership | yes | no | no | no |

  UI hides or disables actions the user lacks permission for (disabled controls explain why via text, not just styling). Enforce permissions in the service layer too.
- **Solo projects:** the owner has all permissions; member management is available but not prominent.

### 5.7 Dashboard (`/projects/:projectId` or `/dashboard`)

- Per project overview: task counts per column, tasks by priority, upcoming and overdue milestones with countdowns, overdue warnings, unresolved tool errors count, prompt success rate (worked / partial / failed), recent activity (last 10 events), and "My tasks" (assigned to me, not closed).
- Global `/dashboard` lists all of the user's projects as cards with quick stats.
- Charts are optional; simple stat tiles and accessible bars with text values are enough. Any chart must also expose its data as text or table.

### 5.8 Export

- From a project menu: **Export tasks**, **Export prompts**, **Export full project** (JSON includes tasks, milestones, prompt entries, tool errors, comments, activity, context, columns).
- Formats: JSON for all; additionally Markdown for prompts (readable log grouped by task) and CSV for tasks.
- Triggered as client-side file downloads.

### 5.9 Dark mode

- Light, dark, system. Toggle in header. All components must be legible and meet contrast in both themes.

---

## 6. Information architecture and routes

| Route | Page |
|---|---|
| `/login`, `/register` | Auth |
| `/dashboard` | Global dashboard (all projects) |
| `/projects` | Project list and "New project" |
| `/projects/:id` | Project dashboard |
| `/projects/:id/board` | Kanban board |
| `/projects/:id/tasks/:taskId` | Board with task detail open |
| `/projects/:id/milestones` | Milestone list |
| `/projects/:id/milestones/:milestoneId` | Milestone summary |
| `/projects/:id/context` | Project context |
| `/projects/:id/prompts` | Prompt library |
| `/projects/:id/settings` | Members, roles, columns, labels, export, delete |
| `/teams` | Teams and members |
| `/profile` | User profile |

All routes except `/login` and `/register` require authentication (redirect to login). Provide a skip-to-content link, a header with project switcher, theme toggle and user menu, and a project sub-navigation (Dashboard, Board, Milestones, Context, Prompts, Settings).

---

## 7. Suggested code structure

```
src/
  types.ts
  lib/
    db.ts            // localStorage repository layer (all reads/writes)
    auth.ts          // hashing, session
    permissions.ts   // role checks
    export.ts        // JSON / CSV / Markdown builders
    contextBuilder.ts// "copy as prompt context" and session starter generators
    dates.ts         // countdown / overdue helpers
    seed.ts          // demo data
  hooks/             // useAuth, useProject, useTasks, etc.
  components/        // Board, Column, TaskCard, TaskDetail, PromptEntryForm, MilestoneCard, ...
  pages/
  App.tsx, main.tsx
README.md
```

---

## 8. Demo data (for `seed.ts`)

- User: "Alex Demo", alex@demo.test, password `demo1234`, GitHub `alex-demo`. A second user "Sam Rivera" (sam@demo.test, same password) in the same team.
- Team: "Demo Studio" with both users.
- Project 1 (solo, owner Alex): "Portfolio Site", with 8 tasks across the four default columns, 2 milestones (one overdue, one due in 10 days), 5 prompt entries covering all three outcomes, 2 tool errors (one resolved), and filled-in project context.
- Project 2 (team "Demo Studio"): "Habit Tracker App", with 10 tasks, 3 milestones, mixed assignees, comments and activity.

---

## 9. Build order for the LLM

1. Types, `db.ts`, `auth.ts`, `permissions.ts`, `dates.ts`.
2. Auth pages, app shell, routing, theme toggle.
3. Projects and teams (CRUD, members, roles).
4. Board with columns, cards, quick add, drag-and-drop and keyboard move.
5. Task detail (details, requirements, notes with markdown checklists, activity).
6. Prompt entries, tool errors, comments.
7. Milestones with progress, countdown, overdue warnings.
8. Project context page and both copy-to-clipboard builders.
9. Filters and search, prompt library.
10. Dashboard, export, seed data.
11. Accessibility pass (checklist in section 3), dark mode pass.
12. **[STRETCH]** custom milestone colours.
13. README with setup and demo credentials.

---

## 10. Definition of done

- `npm install && npm run dev` starts the app with no errors or console warnings; `npm run build` succeeds.
- A new user can register, create a solo project, add tasks, drag them between columns, log a prompt entry and a tool error, create a milestone, see its progress and countdown, and copy the project context and a task's prompt context.
- Team features work: create team, add an existing user, create a team project, assign tasks, and role restrictions are enforced (a viewer cannot edit).
- Every colour-coded status also has an icon or text label; the board is fully operable by keyboard; both themes meet AA contrast.
- Data survives page reloads; "Load demo data" works on a fresh browser.
- Export downloads valid JSON, CSV, and Markdown files.