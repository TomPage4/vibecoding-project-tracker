import React, { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../lib/db';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { 
  Search, 
  Copy, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Check, 
  ChevronDown, 
  ChevronUp,
  MessageSquareQuote
} from 'lucide-react';
import { dateUtils } from '../lib/dates';
import { PromptEntry } from '../types';
import { toast } from '../components/ui/Toast';

export const PromptLibraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const project = db.getProject(id!);

  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'worked' | 'partial' | 'failed'>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!project) return <Navigate to="/dashboard" replace />;

  const tasks = db.getTasks(id);
  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const prompts = db.getProjectPrompts(id!).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const models = useMemo(() => {
    const set = new Set<string>();
    prompts.forEach(p => { if (p.model) set.add(p.model); });
    return Array.from(set);
  }, [prompts]);

  const filtered = useMemo(() => {
    return prompts.filter(p => {
      const task = taskMap.get(p.taskId);
      const textMatches = search === '' ||
        p.promptText.toLowerCase().includes(search.toLowerCase()) ||
        p.resultText.toLowerCase().includes(search.toLowerCase()) ||
        p.outcomeNotes.toLowerCase().includes(search.toLowerCase()) ||
        (task && task.title.toLowerCase().includes(search.toLowerCase()));

      const outcomeMatches = outcomeFilter === 'all' || p.outcome === outcomeFilter;
      const modelMatches = modelFilter === 'all' || p.model === modelFilter;

      return textMatches && outcomeMatches && modelMatches;
    });
  }, [prompts, search, outcomeFilter, modelFilter, taskMap]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const outcomeIcons = {
    worked: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    partial: <HelpCircle className="h-4 w-4 text-amber-500" />,
    failed: <AlertCircle className="h-4 w-4 text-destructive" />
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name} Prompt Library</h1>
          <p className="text-muted-foreground">
            Search, filter, and reuse successful prompts logged across all tasks.
          </p>
        </div>
      </div>

      <ProjectSubNav />

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts, responses, notes, or tasks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value as any)}
        >
          <option value="all">All Outcomes</option>
          <option value="worked">Worked</option>
          <option value="partial">Partially worked</option>
          <option value="failed">Failed</option>
        </select>

        {models.length > 0 && (
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
          >
            <option value="all">All Models</option>
            {models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}

        <div className="text-sm text-muted-foreground">
          Showing {filtered.length} of {prompts.length} prompts
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <MessageSquareQuote className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold">No prompts found</h2>
          <p className="text-muted-foreground mb-4 max-w-sm">
            {prompts.length === 0
              ? 'Prompts logged in your tasks will show up here as a reusable library.'
              : 'No prompts match your current filter criteria.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry: PromptEntry) => {
            const task = taskMap.get(entry.taskId);
            const isExpanded = expandedId === entry.id;

            return (
              <div key={entry.id} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3">
                    {outcomeIcons[entry.outcome]}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{entry.model}</span>
                        {task && (
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            Task: {task.title}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dateUtils.formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={entry.outcome === 'worked' ? 'success' : entry.outcome === 'partial' ? 'warning' : 'destructive'} className="capitalize">
                      {entry.outcome}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t space-y-4 bg-muted/10">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Prompt</label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs gap-1"
                          onClick={() => handleCopy(entry.id, entry.promptText)}
                        >
                          {copiedId === entry.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === entry.id ? 'Copied' : 'Copy Prompt'}
                        </Button>
                      </div>
                      <pre className="p-3 rounded bg-muted text-xs overflow-x-auto whitespace-pre-wrap monospace border">
                        {entry.promptText}
                      </pre>
                    </div>

                    {entry.resultText && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Result</label>
                        <pre className="p-3 rounded bg-muted text-xs overflow-x-auto whitespace-pre-wrap monospace border max-h-60">
                          {entry.resultText}
                        </pre>
                      </div>
                    )}

                    {entry.outcomeNotes && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Outcome Notes</label>
                        <p className="text-sm p-3 border rounded bg-background">{entry.outcomeNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
