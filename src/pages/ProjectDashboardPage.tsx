import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MessageSquareQuote, 
  History,
  AlertCircle,
  Kanban,
  Milestone as MilestoneIcon,
  ListTodo
} from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { AnchorBoard } from '../components/board/AnchorBoard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { dateUtils } from '../lib/dates';
import { cn } from '../lib/utils';

export const ProjectDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { project, tasks, refresh } = useProject(id!);
  
  if (!project) return <Navigate to="/dashboard" replace />;

  const isMember = project.members.some(m => m.userId === user?.id);
  if (!isMember) return <Navigate to="/dashboard" replace />;

  const milestones = db.getMilestones(id!);
  const activity = db.getProjectActivity(id!).slice(-10).reverse();
  const prompts = db.getData().prompts.filter(p => tasks.some(t => t.id === p.taskId));
  const errors = db.getData().errors.filter(e => tasks.some(t => t.id === e.taskId));

  const tasksByPriority = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  const tasksByColumn = project.columns.map(col => ({
    name: col.name,
    category: col.category,
    count: tasks.filter(t => t.columnId === col.id).length
  }));

  const upcomingMilestones = milestones
    .filter(m => !dateUtils.isOverdue(m.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const promptSuccessRate = {
    worked: prompts.filter(p => p.outcome === 'worked').length,
    partial: prompts.filter(p => p.outcome === 'partial').length,
    failed: prompts.filter(p => p.outcome === 'failed').length,
  };

  const myTasks = tasks.filter(t => {
    const col = project.columns.find(c => c.id === t.columnId);
    return t.assigneeId === user?.id && col?.category !== 'closed';
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </div>

      <ProjectSubNav />

      {/* Anchor Board: One link per core deliverable, shared across team */}
      <AnchorBoard project={project} onUpdateProject={refresh} />

      {/* Top Stat Tiles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => {
                const col = project.columns.find(c => c.id === t.columnId);
                return col?.category === 'closed';
              }).length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompt Success</CardTitle>
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.length > 0 
                ? Math.round((promptSuccessRate.worked / prompts.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {promptSuccessRate.worked} worked · {promptSuccessRate.partial} partial · {promptSuccessRate.failed} failed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tool Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errors.filter(e => !e.resolved).length}</div>
            <p className="text-xs text-muted-foreground">
              {errors.filter(e => e.resolved).length} resolved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Open Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to you
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Breakdown and My Tasks */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Kanban className="h-5 w-5 text-primary" aria-hidden="true" /> Tasks by Column
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasksByColumn.map(col => {
              const percentage = tasks.length > 0 ? (col.count / tasks.length) * 100 : 0;
              return (
                <div key={col.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{col.name}</span>
                    <span className="text-muted-foreground">{col.count} tasks</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className={cn(
                        "h-full",
                        col.category === 'closed' ? "bg-emerald-600" : col.category === 'in_progress' ? "bg-primary" : "bg-muted-foreground/60"
                      )} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['high', 'medium', 'low'].map(p => {
              const count = tasksByPriority[p as keyof typeof tasksByPriority];
              const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
              return (
                <div key={p} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{p}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className={cn(
                        "h-full",
                        p === 'high' ? "bg-red-600" : p === 'medium' ? "bg-amber-600" : "bg-slate-600"
                      )} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Second Row: My Tasks and Upcoming Milestones */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" aria-hidden="true" /> My Assigned Open Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No open tasks assigned to you right now.</p>
            ) : (
              <div className="space-y-2.5">
                {myTasks.map(t => {
                  const col = project.columns.find(c => c.id === t.columnId);
                  return (
                    <Link
                      key={t.id}
                      to={`/projects/${project.id}/tasks/${t.id}`}
                      className="flex items-center justify-between p-2.5 rounded-md border hover:bg-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <p className="font-medium text-sm truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{col?.name || 'Open'}</p>
                      </div>
                      <StatusBadge priority={t.priority} />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MilestoneIcon className="h-5 w-5 text-primary" aria-hidden="true" /> Upcoming Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No upcoming milestones</p>
            ) : (
              <div className="space-y-3">
                {upcomingMilestones.map(m => {
                  const mTasks = tasks.filter(t => t.milestoneId === m.id);
                  const closed = mTasks.filter(t => {
                    const col = project.columns.find(c => c.id === t.columnId);
                    return col?.category === 'closed';
                  }).length;
                  const countdown = dateUtils.getCountdown(m.dueDate);
                  return (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-md border bg-card gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{closed}/{mTasks.length} closed</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge variant={countdown.isOverdue ? 'overdue' : 'neutral'} label={countdown.text} />
                        <Link to={`/projects/${project.id}/milestones/${m.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" aria-hidden="true" /> Recent Activity (Last 10 Events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map(act => {
                const author = db.getUser(act.actorId);
                const task = db.getTask(act.taskId);
                const label = act.type.replace('_', ' ');
                return (
                  <div key={act.id} className="flex items-start justify-between text-sm py-1.5 border-b last:border-none">
                    <div>
                      <span className="font-semibold">{author?.name || 'User'} </span>
                      <span className="text-muted-foreground">{label} on </span>
                      <span className="font-medium text-foreground">{task?.title || 'task'}</span>
                      {act.to && <span className="text-xs text-muted-foreground ml-1.5">({act.to})</span>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 pl-2">
                      {dateUtils.formatDate(act.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
