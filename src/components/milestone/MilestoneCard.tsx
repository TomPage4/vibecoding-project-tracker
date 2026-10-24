import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Milestone, Task, Project } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { dateUtils } from '../../lib/dates';
import { cn } from '../../lib/utils';

interface MilestoneCardProps {
  milestone: Milestone;
  tasks: Task[];
  project: Project;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, tasks, project }) => {
  const milestoneTasks = tasks.filter(t => t.milestoneId === milestone.id);
  const closedTasks = milestoneTasks.filter(t => {
    const col = project.columns.find(c => c.id === t.columnId);
    return col?.category === 'closed';
  }).length;

  const totalTasks = milestoneTasks.length;
  const progress = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;
  const { text: countdown, isOverdue } = dateUtils.getCountdown(milestone.dueDate);
  const isCompleted = totalTasks > 0 && closedTasks === totalTasks;

  return (
    <Link to={`${milestone.id}`}>
      <Card className={cn(
        "h-full hover:border-primary/50 transition-colors",
        isOverdue && !isCompleted && "border-destructive/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg line-clamp-1">{milestone.title}</CardTitle>
            {isCompleted ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Done
              </Badge>
            ) : isOverdue ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" /> {countdown}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Due {dateUtils.formatDate(milestone.dueDate)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">Progress</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  isCompleted ? "bg-emerald-500" : isOverdue ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              {closedTasks} of {totalTasks} tasks closed
            </p>
          </div>
          
          {milestone.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2 italic">
              {milestone.notes}
            </p>
          )}
        </CardContent>
        <CardFooter className="pt-0 flex justify-end">
          <div className="text-xs font-medium text-primary flex items-center gap-1 group">
            View Details <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
