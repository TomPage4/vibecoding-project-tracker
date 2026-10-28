import React, { useState } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Trash2,
  Edit3,
  Plus,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { permissions } from '../lib/permissions';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { toast } from '../components/ui/Toast';
import { TaskCard } from '../components/board/TaskCard';
import { dateUtils } from '../lib/dates';
import { cn } from '../lib/utils';

export const MilestoneDetailPage: React.FC = () => {
  const { id: projectId, milestoneId } = useParams<{ id: string; milestoneId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const project = db.getProject(projectId!);
  const milestone = db.getMilestone(milestoneId!);
  
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  // Edit milestone state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(milestone?.title || '');
  const [editDueDate, setEditDueDate] = useState(milestone?.dueDate || '');
  const [editNotes, setEditNotes] = useState(milestone?.notes || '');
  const [formError, setFormError] = useState('');

  if (!project || !milestone) return <Navigate to={`/projects/${projectId}/milestones`} replace />;

  const canManage = user ? permissions.canManageMilestones(project, user.id) : false;

  const tasks = db.getTasks(projectId).filter(t => t.milestoneId === milestone.id);
  const unassignedTasks = db.getTasks(projectId).filter(t => !t.milestoneId);
  
  const closedTasks = tasks.filter(t => {
    const col = project.columns.find(c => c.id === t.columnId);
    return col?.category === 'closed';
  }).length;

  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;
  const { text: countdown, isOverdue } = dateUtils.getCountdown(milestone.dueDate);
  const isCompleted = totalTasks > 0 && closedTasks === totalTasks;

  const [showAddTasks, setShowAddTasks] = useState(false);

  const handleOpenEdit = () => {
    setEditTitle(milestone.title);
    setEditDueDate(milestone.dueDate);
    setEditNotes(milestone.notes || '');
    setFormError('');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setFormError('Milestone title is required');
      return;
    }

    if (!editDueDate || isNaN(new Date(editDueDate).getTime())) {
      setFormError('A valid due date is required');
      return;
    }

    const updated = {
      ...milestone,
      title: trimmedTitle,
      dueDate: editDueDate,
      notes: editNotes.trim(),
    };

    db.saveMilestone(updated);
    toast.success('Milestone updated successfully');
    setIsEditing(false);
    refresh();
  };

  const handleDelete = () => {
    if (!canManage) return;
    if (confirm('Are you sure you want to delete this milestone? Associated tasks will be detached but not deleted.')) {
      db.deleteMilestone(milestone.id);
      toast.info('Milestone deleted');
      navigate(`/projects/${projectId}/milestones`);
    }
  };

  const handleAddTask = (taskId: string) => {
    if (!canManage) return;
    const task = db.getTask(taskId);
    if (task) {
      db.saveTask({ ...task, milestoneId: milestone.id });
      toast.success(`Task attached to milestone`);
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to={`/projects/${projectId}/milestones`}>
            <Button variant="ghost" size="icon" aria-label="Back to milestones">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate">{milestone.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>Due {dateUtils.formatDate(milestone.dueDate)}</span>
              </div>
              {isCompleted ? (
                <StatusBadge variant="done" label="Done" />
              ) : isOverdue ? (
                <StatusBadge variant="overdue" label={`Overdue (${countdown})`} />
              ) : (
                <StatusBadge variant="neutral" label={countdown} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5" 
                onClick={handleOpenEdit}
                aria-label="Edit milestone"
              >
                <Edit3 className="h-4 w-4" /> Edit Milestone
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive" 
                onClick={handleDelete} 
                aria-label="Delete milestone" 
                title="Delete milestone"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
              <span>View-only mode</span>
            </div>
          )}
        </div>
      </div>

      <ProjectSubNav />

      {!canManage && (
        <div className="flex items-center gap-2 p-2.5 px-3 bg-muted/60 border rounded-lg text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
          <span>
            <strong>Limited Access:</strong> You don't have permission to edit, assign tasks, or delete milestones.
          </span>
        </div>
      )}

      {/* Edit Milestone Modal */}
      {isEditing && (
        <Modal 
          isOpen={isEditing} 
          onClose={() => setIsEditing(false)} 
          title={`Edit Milestone: ${milestone.title}`}
          className="max-w-lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {formError && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20" role="alert">
                {formError}
              </div>
            )}
            <Input
              label="Milestone Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              autoFocus
              placeholder="e.g. v1.0 Launch, Alpha Release..."
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes & Objectives</label>
              <textarea
                className="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="What objectives must be achieved for this milestone?"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Milestone Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Overall Completion</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div 
                className="h-4 w-full bg-secondary rounded-full overflow-hidden" 
                role="progressbar" 
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Milestone progress: ${progress}%`}
              >
                <div 
                  className={cn(
                    "h-full transition-all duration-700",
                    isCompleted ? "bg-emerald-600" : isOverdue ? "bg-red-600" : "bg-primary"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {totalTasks === 0 ? 'No tasks yet' : `${closedTasks} of ${totalTasks} tasks closed. ${totalTasks - closedTasks} tasks remaining.`}
              </p>
            </div>

            {milestone.notes && (
              <div className="pt-4 border-t max-w-none">
                <h4 className="text-sm font-bold uppercase text-muted-foreground mb-2">Notes & Objectives</h4>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{milestone.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestone Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Tasks</span>
              <span className="font-semibold">{totalTasks}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Closed (Done)</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{closedTasks}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">In Progress</span>
              <span className="font-semibold">{tasks.filter(t => {
                const col = project.columns.find(c => c.id === t.columnId);
                return col?.category === 'in_progress';
              }).length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">To Do (Open)</span>
              <span className="font-semibold">{tasks.filter(t => {
                const col = project.columns.find(c => c.id === t.columnId);
                return col?.category === 'open';
              }).length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-xl font-bold">Milestone Tasks</h2>
          {canManage ? (
            <Button variant="outline" size="sm" onClick={() => setShowAddTasks(!showAddTasks)}>
              <Plus className="h-4 w-4 mr-2" /> Add Existing Tasks
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                <Plus className="h-4 w-4 mr-2" /> Add Existing Tasks
              </Button>
              <span className="text-xs text-muted-foreground italic">
                You don't have permission to assign tasks to milestones
              </span>
            </div>
          )}
        </div>

        {showAddTasks && canManage && (
          <Card className="bg-muted/30">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Available Tasks to Assign</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {unassignedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No unassigned tasks found.</p>
                ) : (
                  unassignedTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                      <span className="truncate mr-4">{t.title}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleAddTask(t.id)}>Add to Milestone</Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {project.columns.map(col => {
            const columnTasks = tasks.filter(t => t.columnId === col.id);
            if (columnTasks.length === 0) return null;
            return (
              <div key={col.id} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.name}</h3>
                  <span className="text-[10px] bg-secondary px-1.5 rounded-full">{columnTasks.length}</span>
                </div>
                {columnTasks.map(t => (
                  <TaskCard key={t.id} task={t} columns={project.columns} canEdit={false} />
                ))}
              </div>
            );
          })}
        </div>
        
        {tasks.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No tasks assigned to this milestone yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
