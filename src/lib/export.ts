import { db } from './db';
import { Task, PromptEntry } from '../types';

export const exportService = {
  downloadFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportFullProjectJSON(projectId: string) {
    const project = db.getProject(projectId);
    if (!project) return;

    const tasks = db.getTasks(projectId);
    const milestones = db.getMilestones(projectId);
    const prompts = db.getProjectPrompts(projectId);
    const errors = db.getProjectErrors(projectId);
    const activity = db.getProjectActivity(projectId);
    const comments = db.getData().comments.filter(c => tasks.some(t => t.id === c.taskId));

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project,
      columns: project.columns,
      context: project.context,
      tasks,
      milestones,
      prompts,
      errors,
      comments,
      activity
    };

    const json = JSON.stringify(exportData, null, 2);
    this.downloadFile(`${slugify(project.name)}-full-export.json`, json, 'application/json');
  },

  exportTasksJSON(projectId: string) {
    const project = db.getProject(projectId);
    const tasks = db.getTasks(projectId);
    const json = JSON.stringify(tasks, null, 2);
    this.downloadFile(`${slugify(project?.name || 'project')}-tasks.json`, json, 'application/json');
  },

  exportTasksCSV(projectId: string) {
    const project = db.getProject(projectId);
    const tasks = db.getTasks(projectId);
    const columns = new Map(project?.columns.map(c => [c.id, c.name]));
    const milestones = new Map(db.getMilestones(projectId).map(m => [m.id, m.title]));
    const users = new Map(db.getUsers().map(u => [u.id, u.name]));

    const headers = ['ID', 'Title', 'Column', 'Priority', 'Assignee', 'Milestone', 'Requirements Done', 'Total Requirements', 'Created At'];
    const rows = tasks.map((t: Task) => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${columns.get(t.columnId) || ''}"`,
      `"${t.priority}"`,
      `"${t.assigneeId ? users.get(t.assigneeId) || '' : 'Unassigned'}"`,
      `"${t.milestoneId ? milestones.get(t.milestoneId) || '' : ''}"`,
      t.requirements.filter(r => r.done).length,
      t.requirements.length,
      `"${t.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(`${slugify(project?.name || 'project')}-tasks.csv`, csvContent, 'text/csv');
  },

  exportPromptsJSON(projectId: string) {
    const project = db.getProject(projectId);
    const prompts = db.getProjectPrompts(projectId);
    const json = JSON.stringify(prompts, null, 2);
    this.downloadFile(`${slugify(project?.name || 'project')}-prompts.json`, json, 'application/json');
  },

  exportPromptsMarkdown(projectId: string) {
    const project = db.getProject(projectId);
    const tasks = db.getTasks(projectId);
    const prompts = db.getProjectPrompts(projectId);

    const taskPrompts = new Map<string, PromptEntry[]>();
    for (const prompt of prompts) {
      const list = taskPrompts.get(prompt.taskId) || [];
      list.push(prompt);
      taskPrompts.set(prompt.taskId, list);
    }

    const lines: string[] = [
      `# ${project?.name || 'Project'} — AI Prompt & Result Log`,
      `Exported on: ${new Date().toLocaleString()}`,
      `Total Prompts: ${prompts.length}\n`,
      `---`
    ];

    for (const task of tasks) {
      const taskEntries = taskPrompts.get(task.id);
      if (!taskEntries || taskEntries.length === 0) continue;

      lines.push(`\n## Task: ${task.title}`);
      if (task.description) lines.push(`> ${task.description}`);

      for (const p of taskEntries) {
        lines.push(`\n### Model: ${p.model} | Outcome: ${p.outcome.toUpperCase()} (${p.createdAt})`);
        if (p.outcomeNotes) lines.push(`*Notes: ${p.outcomeNotes}*`);
        lines.push('\n**Prompt:**');
        lines.push('```');
        lines.push(p.promptText);
        lines.push('```');
        if (p.resultText) {
          lines.push('\n**Result:**');
          lines.push('```');
          lines.push(p.resultText);
          lines.push('```');
        }
        lines.push('\n---');
      }
    }

    this.downloadFile(`${slugify(project?.name || 'project')}-prompts.md`, lines.join('\n'), 'text/markdown');
  }
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
