import React, { useState } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Trash2,
  Plus
} from 'lucide-react';
import { db } from '../lib/db';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TaskCard } from '../components/board/TaskCard';
import { dateUtils } from '../lib/dates';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const MilestoneDetailPage: React.FC = () => {
  const { id: projectId, milestoneId } = useParams<{ id: string; milestoneId: string }>();
  const navigate = useNavigate();
  
  const project = db.getProject(projectId!);
  const milestone = db.getMilestone(milestoneId!);
  
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  if (!project || !milestone) return <Navigate to={`/projects/${projectId}/milestones`} replace />;

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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this milestone? Associated tasks will be detached but not deleted.')) {
      db.deleteMilestone(milestone.id);
      navigate(`/projects/${projectId}/milestones`);
    }
  };

  const handleAddTask = (taskId: string) => {
    const task = db.getTask(taskId);
    if (task) {
      db.saveTask({ ...task, milestoneId: milestone.id });
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/projects/${projectId}/milestones`}>
          <Button variant="ghost" size="icon" aria-label="Back to milestones"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{milestone.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Due {dateUtils.formatDate(milestone.dueDate)}</span>
            </div>
            {isCompleted ? (
              <Badge variant="success">Completed</Badge>
            ) : isOverdue ? (
              <Badge variant="destructive">Overdue ({countdown})</Badge>
            ) : (
              <Badge variant="outline">{countdown}</Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDelete} aria-label="Delete milestone">
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <ProjectSubNav />

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
                    isCompleted ? "bg-emerald-500" : isOverdue ? "bg-destructive" : "bg-primary"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {totalTasks === 0 ? 'No tasks yet' : `${closedTasks} of ${totalTasks} tasks closed. ${totalTasks - closedTasks} tasks remaining.`}
              </p>
            </div>

            {milestone.notes && (
              <div className="pt-4 border-t prose prose-sm dark:prose-invert max-w-none">
                <h4 className="text-sm font-bold uppercase text-muted-foreground mb-2">Notes & Objectives</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{milestone.notes}</ReactMarkdown>
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
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Milestone Tasks</h2>
          <Button variant="outline" size="sm" onClick={() => setShowAddTasks(!showAddTasks)}>
            <Plus className="h-4 w-4 mr-2" /> Add Existing Tasks
          </Button>
        </div>

        {showAddTasks && (
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
                  <TaskCard key={t.id} task={t} columns={project.columns} />
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
