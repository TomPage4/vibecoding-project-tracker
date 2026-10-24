import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageSquareQuote, 
  History,
  AlertCircle,
  Kanban,
  Milestone as MilestoneIcon,
  ListTodo
} from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { dateUtils } from '../lib/dates';
import { cn } from '../lib/utils';

export const ProjectDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const project = db.getProject(id!);
  if (!project) return <Navigate to="/dashboard" replace />;

  const isMember = project.members.some(m => m.userId === user?.id);
  if (!isMember) return <Navigate to="/dashboard" replace />;

  const tasks = db.getTasks(id);
  const milestones = db.getMilestones(id);
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

  const overdueMilestones = milestones
    .filter(m => {
      const milestoneTasks = tasks.filter(t => t.milestoneId === m.id);
      const isClosed = milestoneTasks.length > 0 && milestoneTasks.every(t => {
        const col = project.columns.find(c => c.id === t.columnId);
        return col?.category === 'closed';
      });
      return dateUtils.isOverdue(m.dueDate) && !isClosed;
    });

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
                        col.category === 'closed' ? "bg-emerald-500" : col.category === 'in_progress' ? "bg-primary" : "bg-muted-foreground/60"
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
                        p === 'high' ? "bg-rose-500" : p === 'medium' ? "bg-amber-500" : "bg-emerald-500"
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
                      className="flex items-center justify-between p-2.5 rounded-md border hover:bg-accent/40 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <p className="font-medium text-sm truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{col?.name || 'Open'}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] uppercase font-bold shrink-0",
                          t.priority === 'high' ? "text-rose-500 border-rose-500/30" : t.priority === 'medium' ? "text-amber-500 border-amber-500/30" : "text-emerald-500 border-emerald-500/30"
                        )}
                      >
                        {t.priority}
                      </Badge>
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
                  return (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-md border bg-card">
                      <div>
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{dateUtils.getCountdown(m.dueDate).text} · {closed}/{mTasks.length} closed</p>
                      </div>
                      <Link to={`/projects/${project.id}/milestones/${m.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
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
              {activity.map(event => (
                <div key={event.id} className="flex items-start gap-3 text-sm pb-2 border-b last:border-0 last:pb-0">
                  <div className="mt-1">
                    <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <p>
                      <span className="font-medium">{db.getUser(event.actorId)?.name || 'User'}</span>
                      {' '}{event.type.replace('_', ' ')}{' '}
                      <span className="font-medium">{db.getTask(event.taskId)?.title || 'Task'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dateUtils.formatDate(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Milestones Warning */}
      {overdueMilestones.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5" role="alert">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Overdue Milestones Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueMilestones.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded bg-card/60 border border-destructive/20">
                <div>
                  <p className="font-semibold text-sm">{m.title}</p>
                  <p className="text-xs text-destructive font-medium">{dateUtils.getCountdown(m.dueDate).text}</p>
                </div>
                <Link to={`/projects/${id}/milestones/${m.id}`}>
                  <Button variant="outline" size="sm" className="border-destructive/30 hover:bg-destructive/10">View Milestone</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
