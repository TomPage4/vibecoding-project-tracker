export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
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

export interface Team {                    // an organisation / team
  id: string;
  name: string;
  memberIds: string[];             // users in the team
  ownerId: string;
  createdAt: string;
}

export interface ProjectMember {
  userId: string;
  role: Role;
}

export interface AnchorLinks {
  presentation?: string;
  demo?: string;
  report?: string;
  documentation?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string | null;           // null = solo project
  ownerId: string;
  members: ProjectMember[];        // always includes the owner
  columns: Column[];
  labels: string[];                // project-wide label vocabulary
  context: ProjectContext;
  anchorLinks?: AnchorLinks;       // Anchor Board deliverable links
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  category: 'open' | 'in_progress' | 'closed';
  order: number;
}

export interface ProjectContext {
  summary: string;                 // project summary
  techStack: string;
  functionalRequirements: string;  // markdown
  nonFunctionalRequirements: string;
  dataRequirements: string;
  databaseNotes: string;
  extraNotes: string;
  updatedAt: string | null;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  notes: string;                   // markdown
  dueDate: string;                 // YYYY-MM-DD
  color: string | null;            // [STRETCH] key from the accessible palette
  createdAt: string;
}

export interface Task {
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

export interface Requirement {
  id: string;
  text: string;
  done: boolean;
}

export interface PromptEntry {            // one prompt attempt on a task
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

export interface ToolError {              // errors an AI tool caused or hit during development
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

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;                    // markdown
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  taskId: string;
  actorId: string;
  type: 'created' | 'moved' | 'priority_changed' | 'milestone_changed'
      | 'assignee_changed' | 'notes_changed' | 'prompt_added' | 'error_logged';
  from: string | null;             // human readable previous value
  to: string | null;               // human readable new value
  createdAt: string;
}

export interface AppData {
  users: User[];
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  prompts: PromptEntry[];
  errors: ToolError[];
  comments: Comment[];
  activity: ActivityEvent[];
}
