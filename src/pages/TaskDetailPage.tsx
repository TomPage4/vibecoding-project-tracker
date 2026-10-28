import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { 

  Trash2, 
  AlertCircle,
  FileText,
  MessageSquareQuote,
  Activity,
  CheckSquare,
  Check,
  Sparkles
} from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';
import { permissions } from '../lib/permissions';
import { contextBuilder } from '../lib/contextBuilder';
import { announce } from '../lib/announcer';
import { toast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TaskRequirements } from '../components/task/TaskRequirements';
import { TaskNotes } from '../components/task/TaskNotes';
import { TaskActivity } from '../components/task/TaskActivity';
import { TaskPrompts } from '../components/task/TaskPrompts';
import { TaskErrors } from '../components/task/TaskErrors';
import { TaskComments } from '../components/task/TaskComments';
import { LabelMultiSelect } from '../components/ui/LabelMultiSelect';
import { cn } from '../lib/utils';

export const TaskDetailPage: React.FC = () => {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project, tasks, updateTask, deleteTask } = useProject(projectId!);
  
  const task = tasks.find(t => t.id === taskId);
  const [activeTab, setActiveTab] = useState<'details' | 'requirements' | 'notes' | 'prompts' | 'errors' | 'activity'>('details');
  const [copiedPromptContext, setCopiedPromptContext] = useState(false);

  if (!project || !task || !user) return <Navigate to={`/projects/${projectId}/board`} replace />;

  const canEdit = permissions.canEditTask(project, user.id);
  const onClose = () => navigate(`/projects/${projectId}/board`);

  const handleUpdate = (updates: any) => {
    if (!canEdit) return;
    updateTask(task.id, updates);
  };

  const handleDelete = () => {
    if (!canEdit) return;
    if (confirm('Are you sure you want to delete this task? This will remove all attached prompts, errors, comments, and activity.')) {
      deleteTask(task.id);
      toast.info(`Task "${task.title}" deleted`);
      announce(`Task "${task.title}" deleted`);
      onClose();
    }
  };

  const handleCopyAsPrompt = () => {
    const prompts = db.getPrompts(task.id).slice(-3);
    const content = contextBuilder.buildTaskPromptContext(project, task, prompts);

    navigator.clipboard.writeText(content);
    setCopiedPromptContext(true);
    toast.success('AI prompt context copied to clipboard!');
    announce('Task copied as AI prompt context to clipboard');
    setTimeout(() => setCopiedPromptContext(false), 2500);
  };

  const members = project.members.map(m => db.getUser(m.userId)).filter(Boolean);
  const milestones = db.getMilestones(projectId);

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'requirements', label: 'Requirements', icon: CheckSquare },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'prompts', label: 'Prompts', icon: MessageSquareQuote },
    { id: 'errors', label: 'Errors', icon: AlertCircle },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title={task.title} className="max-w-5xl h-[88vh]">
      <div className="flex flex-col h-full">
        {/* Header Action Bar */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={handleCopyAsPrompt}
              aria-label="Copy task as AI prompt context"
            >
              {copiedPromptContext ? <Check className="h-4 w-4 text-emerald-500" /> : <Sparkles className="h-4 w-4 text-primary" />}
              {copiedPromptContext ? 'Copied Prompt Context!' : 'Copy for AI'}
            </Button>

            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive gap-1.5" 
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete Task
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Column:</label>
            <select 
              className="bg-background border rounded px-2.5 py-1 text-sm focus:ring-2 ring-primary disabled:opacity-50"
              value={task.columnId}
              disabled={!canEdit}
              onChange={(e) => handleUpdate({ columnId: e.target.value })}
            >
              {project.columns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-tabs */}
        {!canEdit && (
          <div className="flex items-center gap-2 p-2.5 px-3 mb-4 bg-muted/60 border rounded-lg text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
            <span>
              <strong>Limited Access:</strong> You don't have permission to edit details, requirements, notes, prompts, errors, and add comments.
            </span>
          </div>
        )}

        <div className="flex gap-1 border-b mb-6 overflow-x-auto pb-1 pt-1" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                activeTab === tab.id 
                  ? "border-primary text-primary font-semibold" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === 'prompts' && db.getPrompts(task.id).length > 0 && (
                <span className="bg-secondary text-secondary-foreground font-mono px-1.5 rounded-full text-[10px]">
                  {db.getPrompts(task.id).length}
                </span>
              )}
              {tab.id === 'errors' && db.getErrors(task.id).filter(e => !e.resolved).length > 0 && (
                <span className="bg-destructive text-destructive-foreground font-mono px-1.5 rounded-full text-[10px]">
                  {db.getErrors(task.id).filter(e => !e.resolved).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'details' && (
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Title</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  value={task.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  disabled={!canEdit}
                  className="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  value={task.description}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  placeholder="Describe what needs to be built or accomplished..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="task-type-select" className="text-sm font-medium">Type</label>
                  <select
                    id="task-type-select"
                    disabled={!canEdit}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 ring-primary disabled:opacity-60"
                    value={task.type || 'feature'}
                    onChange={(e) => handleUpdate({ type: e.target.value as 'bug' | 'feature' })}
                  >
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="task-priority-select" className="text-sm font-medium">Priority</label>
                  <select
                    id="task-priority-select"
                    disabled={!canEdit}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 ring-primary disabled:opacity-60"
                    value={task.priority}
                    onChange={(e) => handleUpdate({ priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="task-assignee-select" className="text-sm font-medium">Assignee</label>
                  <select
                    id="task-assignee-select"
                    disabled={!canEdit}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 ring-primary disabled:opacity-60"
                    value={task.assigneeId || ''}
                    onChange={(e) => handleUpdate({ assigneeId: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m?.id} value={m?.id}>{m?.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="task-milestone-select" className="text-sm font-medium">Milestone</label>
                  <select
                    id="task-milestone-select"
                    disabled={!canEdit}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 ring-primary disabled:opacity-60"
                    value={task.milestoneId || ''}
                    onChange={(e) => handleUpdate({ milestoneId: e.target.value || null })}
                  >
                    <option value="">No Milestone</option>
                    {milestones.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Labels</label>
                <LabelMultiSelect
                  availableLabels={project.labels || []}
                  selectedLabels={task.labels || []}
                  onChange={(newLabels) => handleUpdate({ labels: newLabels })}
                  disabled={!canEdit}
                  placeholder="Assign labels..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">AI Context Briefing</label>
                <p className="text-xs text-muted-foreground">Specific guidelines, constraints, and instructions to feed the AI model for this task.</p>
                <textarea
                  disabled={!canEdit}
                  className="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm monospace focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  value={task.aiContext}
                  onChange={(e) => handleUpdate({ aiContext: e.target.value })}
                  placeholder="e.g. Preserve existing authentication context. Use Lucide icons. Follow WCAG AA guidelines..."
                />
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <TaskRequirements 
              requirements={task.requirements} 
              disabled={!canEdit}
              onUpdate={(reqs) => handleUpdate({ requirements: reqs })} 
            />
          )}

          {activeTab === 'notes' && (
            <TaskNotes 
              notes={task.notes} 
              disabled={!canEdit}
              onUpdate={(notes) => {
                handleUpdate({ notes });
                db.saveActivity({
                  id: crypto.randomUUID(),
                  taskId: task.id,
                  actorId: user.id,
                  type: 'notes_changed',
                  from: null,
                  to: null,
                  createdAt: new Date().toISOString()
                });
              }} 
            />
          )}

          {activeTab === 'prompts' && (
            <TaskPrompts taskId={task.id} disabled={!canEdit} />
          )}

          {activeTab === 'errors' && (
            <TaskErrors taskId={task.id} disabled={!canEdit} />
          )}

          {activeTab === 'activity' && (
            <TaskActivity activity={db.getActivity(task.id)} />
          )}
        </div>

        {/* Comments Section (available for all projects, especially team projects) */}
        <div className="border-t mt-6 pt-6">
          <TaskComments taskId={task.id} disabled={!canEdit} />
        </div>
      </div>
    </Modal>
  );
};
