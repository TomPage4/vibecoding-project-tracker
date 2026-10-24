import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ActivityEvent } from '../../types';
import { db } from '../../lib/db';
import { dateUtils } from '../../lib/dates';

interface TaskActivityProps {
  activity: ActivityEvent[];
}

export const TaskActivity: React.FC<TaskActivityProps> = ({ activity }) => {
  const sortedActivity = [...activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Activity History</h3>
      
      {sortedActivity.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
      ) : (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {sortedActivity.map((event) => {
            const actor = db.getUser(event.actorId);
            return (
              <div key={event.id} className="relative flex items-start gap-4">
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-background border">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {actor?.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="ml-10 pt-1 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{actor?.name}</span>
                      {' '}{formatEventType(event.type)}{' '}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {dateUtils.formatDate(event.createdAt)}
                    </span>
                  </div>
                  {(event.from || event.to) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded p-1.5 w-fit">
                      {event.from && <span className="line-through">{event.from}</span>}
                      {event.from && event.to && <ArrowRight className="h-3 w-3" />}
                      {event.to && <span className="font-medium text-foreground">{event.to}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function formatEventType(type: ActivityEvent['type']): string {
  switch (type) {
    case 'created': return 'created the task';
    case 'moved': return 'moved to';
    case 'priority_changed': return 'changed priority';
    case 'milestone_changed': return 'updated milestone';
    case 'assignee_changed': return 'changed assignee';
    case 'notes_changed': return 'updated notes';
    case 'prompt_added': return 'added a prompt entry';
    case 'error_logged': return 'logged a tool error';
    default: return String(type).replace('_', ' ');
  }
}
