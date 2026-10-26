import { AppData, User, Team, Project, Task, Milestone, PromptEntry, ToolError, Comment, ActivityEvent } from '../types';

const STORAGE_KEY = 'ai-dev-tracker-data';
const DB_UPDATE_EVENT = 'ai-tracker-db-update';

export function onDbUpdate(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DB_UPDATE_EVENT, listener);
  return () => window.removeEventListener(DB_UPDATE_EVENT, listener);
}

export function notifyDbUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_UPDATE_EVENT));
  }
}

const INITIAL_DATA: AppData = {
  users: [],
  teams: [],
  projects: [],
  tasks: [],
  milestones: [],
  prompts: [],
  errors: [],
  comments: [],
  activity: []
};

export const db = {
  getData(): AppData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return INITIAL_DATA;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse data from localStorage', e);
      return INITIAL_DATA;
    }
  },

  saveData(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    notifyDbUpdate();
  },

  // Users
  getUsers(): User[] { return this.getData().users; },
  getUser(id: string): User | undefined { return this.getUsers().find(u => u.id === id); },
  getUserByEmail(email: string): User | undefined { return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); },
  saveUser(user: User): void {
    const data = this.getData();
    const index = data.users.findIndex(u => u.id === user.id);
    if (index >= 0) data.users[index] = user;
    else data.users.push(user);
    this.saveData(data);
  },

  // Teams
  getTeams(): Team[] { return this.getData().teams; },
  getTeam(id: string): Team | undefined { return this.getTeams().find(t => t.id === id); },
  saveTeam(team: Team): void {
    const data = this.getData();
    const index = data.teams.findIndex(t => t.id === team.id);
    if (index >= 0) data.teams[index] = team;
    else data.teams.push(team);
    this.saveData(data);
  },

  // Projects
  getProjects(): Project[] { return this.getData().projects; },
  getProject(id: string): Project | undefined { return this.getProjects().find(p => p.id === id); },
  saveProject(project: Project): void {
    const data = this.getData();
    const index = data.projects.findIndex(p => p.id === project.id);
    if (index >= 0) data.projects[index] = project;
    else data.projects.push(project);
    this.saveData(data);
  },
  deleteProject(id: string): void {
    const data = this.getData();
    const projectTaskIds = data.tasks.filter(t => t.projectId === id).map(t => t.id);
    data.prompts = data.prompts.filter(p => !projectTaskIds.includes(p.taskId));
    data.errors = data.errors.filter(e => !projectTaskIds.includes(e.taskId));
    data.comments = data.comments.filter(c => !projectTaskIds.includes(c.taskId));
    data.activity = data.activity.filter(a => !projectTaskIds.includes(a.taskId));
    data.milestones = data.milestones.filter(m => m.projectId !== id);
    data.tasks = data.tasks.filter(t => t.projectId !== id);
    data.projects = data.projects.filter(p => p.id !== id);
    this.saveData(data);
  },

  // Tasks
  getTasks(projectId?: string): Task[] {
    const tasks = this.getData().tasks;
    return projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
  },
  getTask(id: string): Task | undefined { return this.getData().tasks.find(t => t.id === id); },
  saveTask(task: Task): void {
    const data = this.getData();
    const index = data.tasks.findIndex(t => t.id === task.id);
    if (index >= 0) data.tasks[index] = task;
    else data.tasks.push(task);
    this.saveData(data);
  },
  deleteTask(id: string): void {
    const data = this.getData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    data.prompts = data.prompts.filter(p => p.taskId !== id);
    data.errors = data.errors.filter(e => e.taskId !== id);
    data.comments = data.comments.filter(c => c.taskId !== id);
    data.activity = data.activity.filter(a => a.taskId !== id);
    this.saveData(data);
  },

  // Milestones
  getMilestones(projectId?: string): Milestone[] {
    const milestones = this.getData().milestones;
    return projectId ? milestones.filter(m => m.projectId === projectId) : milestones;
  },
  getMilestone(id: string): Milestone | undefined { return this.getData().milestones.find(m => m.id === id); },
  saveMilestone(milestone: Milestone): void {
    const data = this.getData();
    const index = data.milestones.findIndex(m => m.id === milestone.id);
    if (index >= 0) data.milestones[index] = milestone;
    else data.milestones.push(milestone);
    this.saveData(data);
  },
  deleteMilestone(id: string): void {
    const data = this.getData();
    data.milestones = data.milestones.filter(m => m.id !== id);
    // Unset milestoneId on tasks
    data.tasks = data.tasks.map(t => t.milestoneId === id ? { ...t, milestoneId: null } : t);
    this.saveData(data);
  },

  // Prompts
  getPrompts(taskId?: string): PromptEntry[] {
    const prompts = this.getData().prompts;
    return taskId ? prompts.filter(p => p.taskId === taskId) : prompts;
  },
  getProjectPrompts(projectId: string): PromptEntry[] {
    const projectTaskIds = this.getTasks(projectId).map(t => t.id);
    return this.getData().prompts.filter(p => projectTaskIds.includes(p.taskId));
  },
  getPrompt(id: string): PromptEntry | undefined { return this.getData().prompts.find(p => p.id === id); },
  savePrompt(prompt: PromptEntry): void {
    const data = this.getData();
    const index = data.prompts.findIndex(p => p.id === prompt.id);
    if (index >= 0) data.prompts[index] = prompt;
    else data.prompts.push(prompt);
    this.saveData(data);
  },
  deletePrompt(id: string): void {
    const data = this.getData();
    data.prompts = data.prompts.filter(p => p.id !== id);
    this.saveData(data);
  },

  // Errors
  getErrors(taskId?: string): ToolError[] {
    const errors = this.getData().errors;
    return taskId ? errors.filter(e => e.taskId === taskId) : errors;
  },
  getProjectErrors(projectId: string): ToolError[] {
    const projectTaskIds = this.getTasks(projectId).map(t => t.id);
    return this.getData().errors.filter(e => projectTaskIds.includes(e.taskId));
  },
  saveError(error: ToolError): void {
    const data = this.getData();
    const index = data.errors.findIndex(e => e.id === error.id);
    if (index >= 0) data.errors[index] = error;
    else data.errors.push(error);
    this.saveData(data);
  },

  // Comments
  getComments(taskId: string): Comment[] {
    return this.getData().comments.filter(c => c.taskId === taskId);
  },
  saveComment(comment: Comment): void {
    const data = this.getData();
    data.comments.push(comment);
    this.saveData(data);
  },

  // Activity
  getActivity(taskId: string): ActivityEvent[] {
    return this.getData().activity.filter(a => a.taskId === taskId);
  },
  getProjectActivity(projectId: string): ActivityEvent[] {
    const projectTaskIds = this.getTasks(projectId).map(t => t.id);
    return this.getData().activity.filter(a => projectTaskIds.includes(a.taskId));
  },
  saveActivity(event: ActivityEvent): void {
    const data = this.getData();
    data.activity.push(event);
    this.saveData(data);
  },

  // Global Reset / Seed
  resetData(data: AppData): void {
    this.saveData(data);
  }
};
