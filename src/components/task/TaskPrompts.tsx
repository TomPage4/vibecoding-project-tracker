import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquareQuote, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Copy,
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Check,
  Edit2
} from 'lucide-react';
import { PromptEntry } from '../../types';
import { db } from '../../lib/db';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { dateUtils } from '../../lib/dates';
import { cn } from '../../lib/utils';
import { announce } from '../../lib/announcer';

interface TaskPromptsProps {
  taskId: string;
  disabled?: boolean;
}

export const TaskPrompts: React.FC<TaskPromptsProps> = ({ taskId, disabled = false }) => {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    promptText: '',
    resultText: '',
    model: '',
    outcome: 'worked' as PromptEntry['outcome'],
    outcomeNotes: ''
  });

  const [editFormData, setEditFormData] = useState({
    outcome: 'worked' as PromptEntry['outcome'],
    outcomeNotes: '',
    promptText: '',
    resultText: ''
  });

  const prompts = db.getPrompts(taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || disabled) return;

    const newPrompt: PromptEntry = {
      id: crypto.randomUUID(),
      taskId,
      promptText: formData.promptText,
      resultText: formData.resultText,
      model: formData.model.trim() || 'Claude',
      outcome: formData.outcome,
      outcomeNotes: formData.outcomeNotes,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    db.savePrompt(newPrompt);
    db.saveActivity({
      id: crypto.randomUUID(),
      taskId,
      actorId: user.id,
      type: 'prompt_added',
      from: null,
      to: newPrompt.model,
      createdAt: new Date().toISOString()
    });

    announce(`Prompt attempt using ${newPrompt.model} logged`);
    setFormData({ promptText: '', resultText: '', model: '', outcome: 'worked', outcomeNotes: '' });
    setIsAdding(false);
    setExpandedId(newPrompt.id);
  };

  const handleStartEdit = (entry: PromptEntry) => {
    setEditFormData({
      outcome: entry.outcome,
      outcomeNotes: entry.outcomeNotes || '',
      promptText: entry.promptText,
      resultText: entry.resultText || ''
    });
    setEditingId(entry.id);
  };

  const handleSaveEdit = (entry: PromptEntry) => {
    if (disabled) return;
    const updated: PromptEntry = {
      ...entry,
      outcome: editFormData.outcome,
      outcomeNotes: editFormData.outcomeNotes,
      promptText: editFormData.promptText,
      resultText: editFormData.resultText
    };
    db.savePrompt(updated);
    announce('Prompt entry updated');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (disabled) return;
    if (confirm('Delete this prompt entry?')) {
      db.deletePrompt(id);
      announce('Prompt entry deleted');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    announce('Prompt copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const outcomeIcons = {
    worked: <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />,
    partial: <HelpCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />,
    failed: <AlertCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
  };

  const outcomeColors = {
    worked: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    partial: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
    failed: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Prompt Log</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Track iterations, code outputs, and what succeeded or failed.</p>
        </div>
        {!isAdding && !disabled && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Prompt Entry
          </Button>
        )}
      </div>

      {isAdding && !disabled && (
        <form onSubmit={handleAddPrompt} className="space-y-4 border rounded-lg p-4 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">AI Model / Tool</label>
              <Input 
                list="model-suggestions"
                placeholder="e.g. Claude 3.5 Sonnet" 
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                required
              />
              <datalist id="model-suggestions">
                <option value="Claude 3.5 Sonnet" />
                <option value="ChatGPT (GPT-4o)" />
                <option value="Gemini 1.5 Pro" />
                <option value="Cursor (auto)" />
                <option value="Lovable" />
                <option value="Replit" />
                <option value="v0" />
                <option value="GitHub Copilot" />
                <option value="Other" />
              </datalist>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Outcome</label>
              <div className="flex gap-2">
                {(['worked', 'partial', 'failed'] as const).map(o => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setFormData({...formData, outcome: o})}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-xs font-semibold rounded border capitalize transition-colors flex items-center justify-center gap-1",
                      formData.outcome === o 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-background hover:bg-accent text-foreground"
                    )}
                  >
                    {outcomeIcons[o]}
                    <span>{o === 'partial' ? 'Partially worked' : o}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Prompt Text</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm monospace"
              value={formData.promptText}
              onChange={(e) => setFormData({...formData, promptText: e.target.value})}
              placeholder="Paste exact prompt given to the AI..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Result / Output</label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm monospace"
              value={formData.resultText}
              onChange={(e) => setFormData({...formData, resultText: e.target.value})}
              placeholder="What code or answer did the AI return?"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Outcome Notes</label>
            <textarea
              className="flex h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.outcomeNotes}
              onChange={(e) => setFormData({...formData, outcomeNotes: e.target.value})}
              placeholder="Why did it work or fail? What required tweaking?"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button size="sm" type="submit">Save Entry</Button>
          </div>
        </form>
      )}

      {prompts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <MessageSquareQuote className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No prompts logged for this task yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map(entry => (
            <div key={entry.id} className="border rounded-lg overflow-hidden bg-card shadow-sm">
              <div 
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-accent/40 transition-colors"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                <div className="flex items-center gap-3">
                  {outcomeIcons[entry.outcome]}
                  <div>
                    <p className="text-sm font-semibold">{entry.model}</p>
                    <p className="text-[11px] text-muted-foreground">{dateUtils.formatDate(entry.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn("capitalize text-xs font-semibold px-2 py-0.5", outcomeColors[entry.outcome])}
                  >
                    {entry.outcome === 'partial' ? 'Partially worked' : entry.outcome}
                  </Badge>
                  {expandedId === entry.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === entry.id && (
                <div className="p-4 border-t space-y-4 bg-muted/10">
                  {editingId === entry.id ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Outcome</label>
                        <div className="flex gap-2">
                          {(['worked', 'partial', 'failed'] as const).map(o => (
                            <button
                              key={o}
                              type="button"
                              onClick={() => setEditFormData({...editFormData, outcome: o})}
                              className={cn(
                                "flex-1 px-2 py-1 text-xs font-medium rounded border capitalize",
                                editFormData.outcome === o ? "bg-primary text-primary-foreground" : "bg-background"
                              )}
                            >
                              {o === 'partial' ? 'Partially worked' : o}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Prompt</label>
                        <textarea
                          className="w-full text-xs monospace p-2 border rounded bg-background"
                          value={editFormData.promptText}
                          onChange={(e) => setEditFormData({...editFormData, promptText: e.target.value})}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Result</label>
                        <textarea
                          className="w-full text-xs monospace p-2 border rounded bg-background"
                          value={editFormData.resultText}
                          onChange={(e) => setEditFormData({...editFormData, resultText: e.target.value})}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Outcome Notes</label>
                        <textarea
                          className="w-full text-xs p-2 border rounded bg-background"
                          value={editFormData.outcomeNotes}
                          onChange={(e) => setEditFormData({...editFormData, outcomeNotes: e.target.value})}
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => handleSaveEdit(entry)}>Save Changes</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase text-muted-foreground">Prompt</label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs gap-1"
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
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Result</label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => handleCopy(`${entry.id}-res`, entry.resultText)}
                            >
                              {copiedId === `${entry.id}-res` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedId === `${entry.id}-res` ? 'Copied' : 'Copy Result'}
                            </Button>
                          </div>
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

                      {!disabled && (
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 gap-1 text-xs" 
                            onClick={() => handleStartEdit(entry)}
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive h-8 px-2 gap-1 text-xs" 
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
