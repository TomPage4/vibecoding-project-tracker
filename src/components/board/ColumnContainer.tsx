import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column, Task } from '../../types';
import { TaskCard } from './TaskCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../ui/Button';
import { Plus, MoreVertical, GripVertical, ArrowLeft, ArrowRight, Trash2, Edit2 } from 'lucide-react';
import { useProject } from '../../hooks/useProject';
import { Input } from '../ui/Input';

interface ColumnProps {
  column: Column;
  allColumns: Column[];
  tasks: Task[];
  projectId: string;
  onMoveTask: (taskId: string, targetColId: string) => void;
  onUpdateColumn?: (columnId: string, updates: Partial<Column>) => void;
  onDeleteColumn?: (column: Column) => void;
  onMoveColumn?: (columnId: string, direction: 'left' | 'right') => void;
  canManage?: boolean;
}

export const ColumnContainer: React.FC<ColumnProps> = ({ 
  column, 
  allColumns, 
  tasks, 
  projectId,
  onMoveTask,
  onUpdateColumn,
  onDeleteColumn,
  onMoveColumn,
  canManage = true
}) => {
  const { addTask } = useProject(projectId);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
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
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

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
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle.trim(), column.id);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim() && onUpdateColumn && editedTitle !== column.name) {
      onUpdateColumn(column.id, { name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const sortedColumns = [...allColumns].sort((a, b) => a.order - b.order);
  const colIndex = sortedColumns.findIndex(c => c.id === column.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="region"
      aria-label={`${column.name} column, ${tasks.length} tasks`}
      className={`flex flex-col w-80 max-h-full rounded-lg bg-secondary/50 border border-border shadow-sm shrink-0 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-border/60 bg-card/30 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded text-muted-foreground"
            aria-label={`Drag to reorder ${column.name} column`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          
          {isEditingTitle ? (
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
            <h2 className="font-semibold text-sm truncate" title={column.name}>
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
        {canManage && (
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
      <div className="p-2.5 border-t border-border/50 mt-auto bg-card/40 rounded-b-lg">
        {isAdding ? (
          <form onSubmit={handleAddTask} className="space-y-2">
            <Input
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsAdding(false)}>Cancel</Button>
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
    </div>
  );
};

const SortableTask: React.FC<{ 
  task: Task; 
  allColumns: Column[];
  onMoveTask: (taskId: string, targetColId: string) => void;
}> = ({ task, allColumns, onMoveTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
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
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-30' : ''}
    >
      <TaskCard 
        task={task} 
        columns={allColumns}
        onMove={(targetColId) => onMoveTask(task.id, targetColId)}
      />
    </div>
  );
};
