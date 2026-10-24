import { Project, Task, PromptEntry } from '../types';

export const contextBuilder = {
  buildProjectSessionStarter(project: Project): string {
    const lines: string[] = [];
    lines.push(`# ${project.name} — AI Context Briefing`);
    lines.push(`*Generated from AI Dev Tracker on ${new Date().toLocaleDateString()}*\n`);

    if (project.context.summary?.trim()) {
      lines.push(`## Project Summary\n${project.context.summary.trim()}`);
    }
    if (project.context.techStack?.trim()) {
      lines.push(`## Tech Stack & Architecture\n${project.context.techStack.trim()}`);
    }
    if (project.context.functionalRequirements?.trim()) {
      lines.push(`## Functional Requirements\n${project.context.functionalRequirements.trim()}`);
    }
    if (project.context.nonFunctionalRequirements?.trim()) {
      lines.push(`## Non-Functional Requirements\n${project.context.nonFunctionalRequirements.trim()}`);
    }
    if (project.context.dataRequirements?.trim()) {
      lines.push(`## Data Requirements\n${project.context.dataRequirements.trim()}`);
    }
    if (project.context.databaseNotes?.trim()) {
      lines.push(`## Database & Storage Notes\n${project.context.databaseNotes.trim()}`);
    }
    if (project.context.extraNotes?.trim()) {
      lines.push(`## Extra Developer Guidelines\n${project.context.extraNotes.trim()}`);
    }

    return lines.join('\n\n');
  },

  buildTaskPromptContext(project: Project, task: Task, recentPrompts: PromptEntry[]): string {
    const lines: string[] = [];

    lines.push(`# Project: ${project.name}`);
    if (project.context.summary?.trim()) {
      lines.push(`**Summary:** ${project.context.summary.trim()}`);
    }
    if (project.context.techStack?.trim()) {
      lines.push(`**Tech Stack:** ${project.context.techStack.trim()}`);
    }

    lines.push(`\n---\n`);
    lines.push(`## Active Task: ${task.title}`);
    if (task.description?.trim()) {
      lines.push(task.description.trim());
    }

    if (task.requirements && task.requirements.length > 0) {
      lines.push(`\n### Requirements / Definition of Done`);
      task.requirements.forEach(r => {
        lines.push(`- [${r.done ? 'x' : ' '}] ${r.text}`);
      });
    }

    if (task.aiContext?.trim()) {
      lines.push(`\n### AI Context & Specific Instructions\n${task.aiContext.trim()}`);
    }

    if (task.notes?.trim()) {
      lines.push(`\n### Task Notes\n${task.notes.trim()}`);
    }

    if (recentPrompts && recentPrompts.length > 0) {
      lines.push(`\n### Previous Prompt Attempts (Most Recent ${recentPrompts.length})`);
      recentPrompts.forEach((p, idx) => {
        lines.push(`\n#### Attempt #${idx + 1} (${p.model} — ${p.outcome.toUpperCase()})`);
        if (p.outcomeNotes?.trim()) {
          lines.push(`*Notes: ${p.outcomeNotes.trim()}*`);
        }
        lines.push('```');
        lines.push(p.promptText);
        lines.push('```');
        if (p.resultText?.trim()) {
          lines.push('Result:');
          lines.push('```');
          lines.push(p.resultText.trim());
          lines.push('```');
        }
      });
    }

    return lines.join('\n');
  }
};
