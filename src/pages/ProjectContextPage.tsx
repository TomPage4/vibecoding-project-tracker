import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../lib/db';
import { contextBuilder } from '../lib/contextBuilder';
import { announce } from '../lib/announcer';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Copy, Check, Sparkles, Eye, Code2 } from 'lucide-react';
import { ProjectContext } from '../types';

export const ProjectContextPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const project = db.getProject(id!);

  const [context, setContext] = useState<ProjectContext>(() => {
    return project?.context || {
      summary: '',
      techStack: '',
      functionalRequirements: '',
      nonFunctionalRequirements: '',
      dataRequirements: '',
      databaseNotes: '',
      extraNotes: '',
      updatedAt: null,
    };
  });

  const [saved, setSaved] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!project) return <Navigate to="/dashboard" replace />;

  const handleChange = (field: keyof ProjectContext, value: string) => {
    const updated = {
      ...context,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    setContext(updated);
    db.saveProject({
      ...project,
      context: updated,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fullMarkdown = contextBuilder.buildProjectSessionStarter({
    ...project,
    context
  });

  const copyFullContext = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopiedAll(true);
    announce('Full AI session starter copied to clipboard');
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const copySingleSection = (title: string, value: string, sectionKey: string) => {
    const md = `## ${title}\n${value.trim()}`;
    navigator.clipboard.writeText(md);
    setCopiedSection(sectionKey);
    announce(`${title} copied to clipboard`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections: { key: keyof ProjectContext; title: string; desc: string; placeholder: string }[] = [
    { key: 'summary', title: 'Project Summary', desc: 'High-level purpose, user value, and scope', placeholder: 'e.g. A web application designed to help developers track AI prompts and sessions...' },
    { key: 'techStack', title: 'Tech Stack & Architecture', desc: 'Languages, frameworks, database, libraries, key patterns', placeholder: 'e.g. React 18, Vite, TypeScript, Tailwind CSS, LocalStorage repository layer...' },
    { key: 'functionalRequirements', title: 'Functional Requirements', desc: 'Core feature requirements and user stories (Markdown)', placeholder: '- [ ] User authentication and session management\n- [ ] Kanban task board with dnd\n- [ ] Prompt iteration tracking' },
    { key: 'nonFunctionalRequirements', title: 'Non-Functional Requirements', desc: 'Accessibility, performance, browser targets', placeholder: 'e.g. WCAG 2.1 AA contrast in light & dark mode, keyboard navigation, sub-second responses...' },
    { key: 'dataRequirements', title: 'Data Requirements', desc: 'Domain entities, schemas, relations', placeholder: 'e.g. Users, Teams, Projects, Columns, Tasks, Milestones, Prompts, Errors...' },
    { key: 'databaseNotes', title: 'Database & Storage Notes', desc: 'Persistence layout, schema notes, conventions', placeholder: 'e.g. LocalStorage under key ai-dev-tracker-data behind src/lib/db.ts...' },
    { key: 'extraNotes', title: 'Extra Session Instructions', desc: 'Specific guidelines for the AI assistant (coding conventions, constraints)', placeholder: 'e.g. Always write clean TypeScript with strict types. Never use any. Keep functions modular...' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name} Context</h1>
          <p className="text-muted-foreground text-sm">
            Curated briefing documents to paste at the start of any session with an AI tool (Claude, ChatGPT, Cursor, Copilot).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800" role="status">
              Saved
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPreview(!showPreview)} 
            className="gap-1.5"
            aria-expanded={showPreview}
          >
            {showPreview ? <Code2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Copy Preview'}
          </Button>
          <Button onClick={copyFullContext} className="gap-2">
            {copiedAll ? <Check className="h-4 w-4 text-emerald-300" /> : <Sparkles className="h-4 w-4" />}
            {copiedAll ? 'Copied Full Session Starter!' : 'Copy Session Starter'}
          </Button>
        </div>
      </div>

      <ProjectSubNav />

      {/* Copy Preview Panel */}
      {showPreview && (
        <Card className="border-primary/40 bg-accent/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Session Starter Output Preview
              </CardTitle>
              <CardDescription>
                This exact markdown block is generated and copied to your clipboard when clicking "Copy Session Starter".
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={copyFullContext} className="gap-1.5 text-xs">
              {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedAll ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-md bg-muted text-xs monospace whitespace-pre-wrap max-h-80 overflow-y-auto border border-border">
              {fullMarkdown}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Editable Context Sections */}
      <div className="grid gap-6">
        {sections.map(({ key, title, desc, placeholder }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                disabled={!context[key]?.trim()}
                onClick={() => copySingleSection(title, context[key] || '', key)}
                aria-label={`Copy ${title} section`}
              >
                {copiedSection === key ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedSection === key ? 'Copied' : 'Copy Section'}
              </Button>
            </CardHeader>
            <CardContent>
              <textarea
                className="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring monospace"
                placeholder={placeholder}
                value={context[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                aria-label={title}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
