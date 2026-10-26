import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  AlertCircle, 
  MessageSquareQuote, 
  CheckSquare, 
  Clock, 
  User as UserIcon,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';
import { Task, Column } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { db } from '../../lib/db';
import { dateUtils } from '../../lib/dates';
import { announce } from '../../lib/announcer';

interface TaskCardProps {
  task: Task;
  columns?: Column[];
  onMove?: (columnId: string) => void;
  canEdit?: boolean;
  isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  columns = [], 
  onMove, 
  canEdit = true,
  isOverlay 
}) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const assignee = task.assigneeId ? db.getUser(task.assigneeId) : null;
  const milestone = task.milestoneId ? db.getMilestone(task.milestoneId) : null;
  const promptsCount = db.getPrompts(task.id).length;
  const errorsCount = db.getErrors(task.id).filter(e => !e.resolved).length;
  
  const doneRequirements = task.requirements ? task.requirements.filter(r => r.done).length : 0;
  const totalRequirements = task.requirements ? task.requirements.length : 0;

  const priorityConfig = {
    high: {
      label: 'High',
      color: 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/10',
      icon: <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
    },
    medium: {
      label: 'Medium',
      color: 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10',
      icon: <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
    },
    low: {
      label: 'Low',
      color: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      icon: <ChevronRight className="h-3 w-3 mr-1" aria-hidden="true" />
    },
  };

  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  // Milestone countdown text
  const milestoneCountdown = milestone ? dateUtils.getCountdown(milestone.dueDate) : null;

  // Close menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMoveMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMoveMenuOpen) {
        setIsMoveMenuOpen(false);
      }
    };

    if (isMoveMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoveMenuOpen]);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking a button or dropdown, don't navigate
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.move-menu')) {
      return;
    }
    navigate(`/projects/${projectId || task.projectId}/tasks/${task.id}`);
  };

  const handleMoveToColumn = (targetCol: Column) => {
    if (onMove) {
      onMove(targetCol.id);
      announce(`Task "${task.title}" moved to ${targetCol.name}`);
    }
    setIsMoveMenuOpen(false);
  };

  const otherColumns = columns.filter(c => c.id !== task.columnId);

  return (
    <div className="relative group">
      <Card 
        onClick={handleCardClick}
        tabIndex={0}
        role="button"
        aria-label={`${task.title}, priority ${priority.label}, column ${columns.find(c => c.id === task.columnId)?.name || ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            navigate(`/projects/${projectId || task.projectId}/tasks/${task.id}`);
          }
        }}
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary",
          isOverlay && "border-primary shadow-lg scale-105"
        )}
      >
        <div className="p-3.5 pt-3.5 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
              {task.title}
            </h3>

            {/* Keyboard "Move to..." menu button */}
            {otherColumns.length > 0 && onMove && (
              <div className="relative move-menu shrink-0">
                {!canEdit ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled
                    className="h-7 px-2 text-xs gap-1 opacity-40 cursor-not-allowed text-muted-foreground"
                    title="Viewers cannot move tasks (read-only mode)"
                    aria-label="Move task (disabled for viewers)"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only text-[11px]">Move</span>
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs gap-1 opacity-70 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoveMenuOpen(!isMoveMenuOpen);
                    }}
                    aria-expanded={isMoveMenuOpen}
                    aria-haspopup="menu"
                    aria-label={`Move "${task.title}" to another column`}
                    title="Move to another column"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only text-[11px]">Move</span>
                  </Button>
                )}

                {canEdit && isMoveMenuOpen && (
                  <div 
                    ref={menuRef}
                    role="menu"
                    aria-label={`Move ${task.title} options`}
                    className="absolute right-0 top-full mt-1 z-30 w-48 rounded-md border bg-popover p-1 shadow-lg text-popover-foreground text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2 py-1 font-semibold text-muted-foreground border-b mb-1">
                      Move task to:
                    </div>
                    {otherColumns.map(col => (
                      <button
                        key={col.id}
                        role="menuitem"
                        onClick={() => handleMoveToColumn(col)}
                        className="w-full text-left rounded px-2 py-1.5 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none flex items-center justify-between"
                      >
                        <span>{col.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">({col.category.replace('_', ' ')})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Badges / Chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {/* Priority with icon and text */}
            <Badge 
              variant="outline" 
              className={cn("px-1.5 h-5 text-[10px] uppercase font-bold", priority.color)}
            >
              {priority.icon}
              <span>{priority.label}</span>
            </Badge>

            {/* Milestone with icon and countdown text */}
            {milestone && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "px-1.5 h-5 text-[10px] font-medium gap-1 max-w-[140px] truncate",
                  milestoneCountdown?.isOverdue && "border border-destructive/40 text-destructive"
                )}
                title={`${milestone.title}: ${milestoneCountdown?.text || ''}`}
              >
                <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{milestone.title}</span>
                {milestoneCountdown && (
                  <span className="text-[9px] opacity-75">({milestoneCountdown.text})</span>
                )}
              </Badge>
            )}

            {/* Labels */}
            {task.labels.map(label => (
              <Badge key={label} variant="outline" className="px-1.5 h-5 text-[10px] font-medium">
                {label}
              </Badge>
            ))}
          </div>

          {/* Footer stats: requirements, prompts, tool errors, assignee */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              {totalRequirements > 0 && (
                <div 
                  className="flex items-center gap-1" 
                  title={`Requirements: ${doneRequirements} of ${totalRequirements} complete`}
                  aria-label={`${doneRequirements} of ${totalRequirements} requirements done`}
                >
                  <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{doneRequirements}/{totalRequirements}</span>
                </div>
              )}

              {promptsCount > 0 && (
                <div 
                  className="flex items-center gap-1 text-primary" 
                  title={`${promptsCount} AI prompt ${promptsCount === 1 ? 'attempt' : 'attempts'}`}
                  aria-label={`${promptsCount} prompt attempts`}
                >
                  <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{promptsCount}</span>
                </div>
              )}

              {errorsCount > 0 && (
                <div 
                  className="flex items-center gap-1 text-destructive font-semibold" 
                  title={`${errorsCount} unresolved tool ${errorsCount === 1 ? 'error' : 'errors'}`}
                  aria-label={`${errorsCount} unresolved tool errors`}
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{errorsCount}</span>
                </div>
              )}
            </div>

            {/* Assignee */}
            {assignee ? (
              <div 
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                title={`Assigned to ${assignee.name}`}
              >
                <span className="sr-only">Assigned to {assignee.name}</span>
                <div 
                  className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20"
                  aria-hidden="true"
                >
                  {assignee.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            ) : (
              <div 
                className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center text-muted-foreground"
                title="Unassigned"
                aria-label="Unassigned"
              >
                <UserIcon className="h-3 w-3" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
