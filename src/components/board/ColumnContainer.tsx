import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column, Task } from '../../types';
import { TaskCard } from './TaskCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../ui/Button';
import { Plus, MoreVertical, GripVertical, ArrowLeft, ArrowRight, Trash2, Edit2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { LabelMultiSelect } from '../ui/LabelMultiSelect';

interface ColumnProps {
  column: Column;
  allColumns: Column[];
  tasks: Task[];
  projectId: string;
  availableLabels?: string[];
  onMoveTask: (taskId: string, targetColId: string) => void;
  onAddTask?: (title: string, columnId: string, type?: 'bug' | 'feature', labels?: string[]) => void;
  onUpdateColumn?: (columnId: string, updates: Partial<Column>) => void;
  onDeleteColumn?: (column: Column) => void;
  onMoveColumn?: (columnId: string, direction: 'left' | 'right') => void;
  canManage?: boolean;
  canEdit?: boolean;
  isOverlay?: boolean;
}

export const ColumnContainer: React.FC<ColumnProps> = ({ 
  column, 
  allColumns, 
  tasks, 
  projectId: _projectId,
  availableLabels = [],
  onMoveTask,
  onAddTask,
  onUpdateColumn,
  onDeleteColumn,
  onMoveColumn,
  canManage = true,
  canEdit = true,
  isOverlay = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'bug' | 'feature'>('feature');
  const [newTaskLabels, setNewTaskLabels] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.name);

  const menuRef = useRef<HTMLDivElement>(null);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    disabled: isOverlay || !canManage,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = isOverlay ? undefined : {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  useEffect(() => {
    setEditedTitle(column.name);
  }, [column.name]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !canEdit) return;
    if (onAddTask) {
      onAddTask(newTaskTitle.trim(), column.id, newTaskType, newTaskLabels);
    }
    setNewTaskTitle('');
    setNewTaskType('feature');
    setNewTaskLabels([]);
    setIsAdding(false);
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (editedTitle.trim() && onUpdateColumn && editedTitle !== column.name) {
      onUpdateColumn(column.id, { name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const sortedColumns = [...allColumns].sort((a, b) => a.order - b.order);
  const colIndex = sortedColumns.findIndex(c => c.id === column.id);

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      role="region"
      aria-label={`${column.name} column, ${tasks.length} tasks`}
      className={`flex flex-col w-80 max-h-full rounded-lg bg-secondary/50 border border-border shadow-sm shrink-0 ${
        isDragging ? 'opacity-40' : ''
      } ${isOverlay ? 'shadow-2xl border-primary ring-2 ring-primary/40 rotate-1' : ''}`}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-border/60 bg-card/30 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {canManage ? (
            <button 
              {...(!isOverlay ? attributes : {})} 
              {...(!isOverlay ? listeners : {})} 
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={`Drag to reorder ${column.name} column`}
              type="button"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <span 
              className="p-1 text-muted-foreground/30 cursor-not-allowed" 
              title="Viewers cannot reorder columns (read-only mode)"
              aria-label="Column drag disabled for viewers"
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          
          {isEditingTitle && canManage ? (
            <form onSubmit={handleSaveTitle} className="flex-1">
              <input
                autoFocus
                className="w-full text-sm font-semibold bg-background border px-1.5 py-0.5 rounded"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
              />
            </form>
          ) : (
            <h2 className="font-semibold text-sm line-clamp-1 focus:overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm leading-normal" title={column.name}>
              {column.name}
            </h2>
          )}

          <span 
            className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-mono font-medium shrink-0"
            aria-label={`${tasks.length} tasks`}
          >
            {tasks.length}
          </span>
        </div>

        {/* Column menu */}
        {canManage && !isOverlay && (
          <div className="relative" ref={menuRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={`Options for ${column.name} column`}
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-md border bg-popover p-1 shadow-md text-xs">
                <button
                  onClick={() => {
                    setIsEditingTitle(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Rename Column
                </button>

                {onMoveColumn && colIndex > 0 && (
                  <button
                    onClick={() => {
                      onMoveColumn(column.id, 'left');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Move Left
                  </button>
                )}

                {onMoveColumn && colIndex < sortedColumns.length - 1 && (
                  <button
                    onClick={() => {
                      onMoveColumn(column.id, 'right');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
                  >
                    <ArrowRight className="h-3.5 w-3.5" /> Move Right
                  </button>
                )}

                {onDeleteColumn && (
                  <>
                    <div className="my-1 border-t" />
                    <button
                      onClick={() => {
                        onDeleteColumn(column);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Column
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Cards Area - Generous top padding and gap between cards */}
      <div className="flex-1 overflow-y-auto p-3 pt-3 space-y-3 min-h-[140px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask 
              key={task.id} 
              task={task} 
              allColumns={allColumns}
              onMoveTask={onMoveTask}
              canEdit={canEdit}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-28 flex items-center justify-center border-2 border-dashed border-border/60 rounded-md text-xs text-muted-foreground italic">
            No tasks in {column.name}
          </div>
        )}
      </div>

      {/* Quick Add Task */}
      {!isOverlay && (
        <div className="p-2.5 border-t border-border/50 mt-auto bg-card/40 rounded-b-lg">
          {!canEdit ? (
            <p className="px-2 py-1 text-xs text-muted-foreground italic text-center">
              You don't have permission to add tasks
            </p>
          ) : isAdding ? (
            <form onSubmit={handleAddTask} className="space-y-2.5">
              <Input
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewTaskTitle('');
                    setNewTaskType('feature');
                    setNewTaskLabels([]);
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor={`task-type-${column.id}`} className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Type:
                  </label>
                  <select
                    id={`task-type-${column.id}`}
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as 'bug' | 'feature')}
                    className="h-6 text-xs rounded border border-input bg-background px-1.5 py-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                  </select>
                </div>

                {availableLabels.length > 0 && (
                  <LabelMultiSelect
                    compact
                    availableLabels={availableLabels}
                    selectedLabels={newTaskLabels}
                    onChange={setNewTaskLabels}
                    placeholder="Labels"
                  />
                )}
              </div>
              <div className="flex gap-2 pt-0.5">
                <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs" 
                  onClick={() => {
                    setIsAdding(false);
                    setNewTaskTitle('');
                    setNewTaskType('feature');
                    setNewTaskLabels([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground h-8 text-xs font-medium"
              onClick={() => setIsAdding(true)}
              aria-label={`Add task to ${column.name}`}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add task
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const SortableTask: React.FC<{ 
  task: Task; 
  allColumns: Column[];
  onMoveTask: (taskId: string, targetColId: string) => void;
  canEdit?: boolean;
}> = ({ task, allColumns, onMoveTask, canEdit = true }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    disabled: !canEdit,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!canEdit ? {} : attributes)}
      {...(!canEdit ? {} : listeners)}
      className={isDragging ? 'opacity-30' : ''}
    >
      <TaskCard 
        task={task} 
        columns={allColumns}
        onMove={(targetColId) => onMoveTask(task.id, targetColId)}
        canEdit={canEdit}
      />
    </div>
  );
};
