import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useProject } from '../hooks/useProject';
import { useAuth } from '../hooks/useAuth';
import { permissions } from '../lib/permissions';
import { db } from '../lib/db';
import { announce } from '../lib/announcer';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { ColumnContainer } from '../components/board/ColumnContainer';
import { TaskCard } from '../components/board/TaskCard';
import { Task, Column } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Input } from '../components/ui/Input';

export const BoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { project, tasks, moveTask, refresh } = useProject(id!);
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Column management modal states
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColCategory, setNewColCategory] = useState<Column['category']>('in_progress');

  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [migrateTargetColId, setMigrateTargetColId] = useState('');

  // Read filters from URL query string
  const searchQuery = searchParams.get('q') || '';
  const priorityFilter = searchParams.get('priority') || '';
  const assigneeFilter = searchParams.get('assignee') || '';
  const milestoneFilter = searchParams.get('milestone') || '';
  const labelFilter = searchParams.get('label') || '';

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = Boolean(searchQuery || priorityFilter || assigneeFilter || milestoneFilter || labelFilter);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Free-text search: title, description, notes
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      
      const matchesPriority = !priorityFilter || t.priority === priorityFilter;
      const matchesAssignee = !assigneeFilter || (assigneeFilter === 'unassigned' ? !t.assigneeId : t.assigneeId === assigneeFilter);
      const matchesMilestone = !milestoneFilter || (milestoneFilter === 'none' ? !t.milestoneId : t.milestoneId === milestoneFilter);
      const matchesLabel = !labelFilter || t.labels.includes(labelFilter);

      return matchesSearch && matchesPriority && matchesAssignee && matchesMilestone && matchesLabel;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter, milestoneFilter, labelFilter]);

  if (!project) return <Navigate to="/dashboard" replace />;

  const canManage = user ? permissions.canManageProject(project, user.id) : false;

  // DND Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    if (isOverATask) {
      const currentActive = tasks.find(t => t.id === activeId);
      const overTask = tasks.find(t => t.id === overId);
      if (currentActive && overTask && currentActive.columnId !== overTask.columnId) {
        moveTask(String(activeId), overTask.columnId, overTask.order);
      }
    }

    if (isOverAColumn) {
      const currentActive = tasks.find(t => t.id === activeId);
      if (currentActive && currentActive.columnId !== overId) {
        moveTask(String(activeId), String(overId), 0);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';

    if (isActiveATask && isOverATask) {
      const currentActive = tasks.find(t => t.id === activeId);
      const overTask = tasks.find(t => t.id === overId);

      if (currentActive && overTask && currentActive.columnId === overTask.columnId) {
        const columnTasks = tasks
          .filter(t => t.columnId === currentActive.columnId)
          .sort((a, b) => a.order - b.order);
        
        const oldIndex = columnTasks.findIndex(t => t.id === activeId);
        const newIndex = columnTasks.findIndex(t => t.id === overId);
        
        if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(columnTasks, oldIndex, newIndex);
          newOrder.forEach((t, i) => {
            moveTask(t.id, t.columnId, i);
          });
        }
      }
    }

    setActiveTask(null);
  };

  const handleDirectMoveTask = (taskId: string, targetColId: string) => {
    const targetCol = project.columns.find(c => c.id === targetColId);
    const task = tasks.find(t => t.id === taskId);
    if (!targetCol || !task) return;
    const colTasks = tasks.filter(t => t.columnId === targetColId);
    moveTask(taskId, targetColId, colTasks.length);
    announce(`Task "${task.title}" moved to ${targetCol.name}`);
  };

  // Column management actions
  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !canManage) return;

    const newCol: Column = {
      id: crypto.randomUUID(),
      name: newColName.trim(),
      category: newColCategory,
      order: project.columns.length,
    };

    db.saveProject({
      ...project,
      columns: [...project.columns, newCol],
    });
    refresh();
    setNewColName('');
    setIsAddColumnOpen(false);
  };

  const handleUpdateColumn = (colId: string, updates: Partial<Column>) => {
    if (!canManage) return;
    const cols = project.columns.map(c => c.id === colId ? { ...c, ...updates } : c);
    if (!cols.some(c => c.category === 'closed')) {
      alert('At least one column must retain category "closed" for milestone tracking.');
      return;
    }
    db.saveProject({ ...project, columns: cols });
    refresh();
  };

  const handleMoveColumn = (colId: string, direction: 'left' | 'right') => {
    if (!canManage) return;
    const sorted = [...project.columns].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(c => c.id === colId);
    if (idx === -1) return;
    if (direction === 'left' && idx === 0) return;
    if (direction === 'right' && idx === sorted.length - 1) return;

    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    const temp = sorted[idx].order;
    sorted[idx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = temp;

    db.saveProject({ ...project, columns: sorted });
    refresh();
  };

  const handleDeleteColumnRequest = (col: Column) => {
    if (!canManage) return;
    if (project.columns.length <= 1) {
      alert('A board must have at least one column.');
      return;
    }
    const isOnlyClosed = col.category === 'closed' && project.columns.filter(c => c.category === 'closed').length === 1;
    if (isOnlyClosed) {
      alert('Cannot delete the only "closed" column. At least one closed column is required.');
      return;
    }

    const tasksInCol = tasks.filter(t => t.columnId === col.id);
    if (tasksInCol.length > 0) {
      const remaining = project.columns.filter(c => c.id !== col.id);
      setMigrateTargetColId(remaining[0]?.id || '');
      setColumnToDelete(col);
    } else {
      const cols = project.columns.filter(c => c.id !== col.id);
      db.saveProject({ ...project, columns: cols });
      refresh();
    }
  };

  const confirmDeleteColumn = () => {
    if (!columnToDelete || !migrateTargetColId) return;
    const tasksInCol = tasks.filter(t => t.columnId === columnToDelete.id);
    for (const t of tasksInCol) {
      db.saveTask({ ...t, columnId: migrateTargetColId });
    }
    const cols = project.columns.filter(c => c.id !== columnToDelete.id);
    db.saveProject({ ...project, columns: cols });
    refresh();
    setColumnToDelete(null);
  };

  const projectMembers = project.members.map(m => db.getUser(m.userId)).filter(Boolean);
  const projectMilestones = db.getMilestones(project.id);

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] w-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name} Board</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag cards or use each card's "Move" menu for full keyboard navigation.
          </p>
        </div>
      </div>

      <ProjectSubNav />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search tasks, descriptions, notes..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => updateParam('q', e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          <Button 
            variant={isFilterPanelOpen || hasActiveFilters ? "secondary" : "outline"} 
            size="sm"
            className="gap-2 h-9"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            aria-expanded={isFilterPanelOpen}
          >
            <Filter className="h-4 w-4" /> Filters {hasActiveFilters && '(Active)'}
          </Button>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1.5 h-9 text-xs" 
              onClick={clearAllFilters}
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}

          <div className="ml-auto text-xs text-muted-foreground font-medium">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>

        {/* Collapsible Filter Controls */}
        {isFilterPanelOpen && (
          <div className="flex flex-wrap gap-3 p-3 bg-secondary/30 rounded-lg border text-xs items-center">
            {/* Priority filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Priority</label>
              <select
                className="h-8 rounded border bg-background px-2 py-1 text-xs block"
                value={priorityFilter}
                onChange={(e) => updateParam('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assignee filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Assignee</label>
              <select
                className="h-8 rounded border bg-background px-2 py-1 text-xs block"
                value={assigneeFilter}
                onChange={(e) => updateParam('assignee', e.target.value)}
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {projectMembers.map(m => (
                  <option key={m?.id} value={m?.id}>{m?.name}</option>
                ))}
              </select>
            </div>

            {/* Milestone filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Milestone</label>
              <select
                className="h-8 rounded border bg-background px-2 py-1 text-xs block"
                value={milestoneFilter}
                onChange={(e) => updateParam('milestone', e.target.value)}
              >
                <option value="">All Milestones</option>
                <option value="none">No Milestone</option>
                {projectMilestones.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Label filter */}
            {project.labels.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">Label</label>
                <select
                  className="h-8 rounded border bg-background px-2 py-1 text-xs block"
                  value={labelFilter}
                  onChange={(e) => updateParam('label', e.target.value)}
                >
                  <option value="">All Labels</option>
                  {project.labels.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kanban Columns with generous top padding & full width */}
      <div className="flex-1 overflow-x-auto pt-3 pb-8">
        <div className="flex gap-6 items-start min-w-max pb-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {[...project.columns].sort((a, b) => a.order - b.order).map(column => (
              <ColumnContainer
                key={column.id}
                column={column}
                allColumns={project.columns}
                tasks={filteredTasks.filter(t => t.columnId === column.id).sort((a, b) => a.order - b.order)}
                projectId={project.id}
                onMoveTask={handleDirectMoveTask}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumnRequest}
                onMoveColumn={handleMoveColumn}
                canManage={canManage}
              />
            ))}
            
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeTask && (
                <TaskCard 
                  task={activeTask} 
                  columns={project.columns}
                  isOverlay 
                />
              )}
            </DragOverlay>
          </DndContext>
          
          {canManage && (
            <Button 
              variant="outline" 
              className="h-12 w-80 justify-start border-dashed shrink-0"
              onClick={() => setIsAddColumnOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Column
            </Button>
          )}
        </div>
      </div>

      {/* Add Column Modal */}
      {isAddColumnOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddColumnOpen(false)}
          title="Add Board Column"
        >
          <form onSubmit={handleCreateColumn} className="space-y-4">
            <Input
              label="Column Name"
              placeholder="e.g. Blocked, QA, Ready to Ship"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              required
              autoFocus
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <p className="text-xs text-muted-foreground">
                Determines how milestone progress and completion metrics evaluate tasks in this column.
              </p>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newColCategory}
                onChange={(e) => setNewColCategory(e.target.value as any)}
              >
                <option value="open">Open (To Do)</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed (Done)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={() => setIsAddColumnOpen(false)}>Cancel</Button>
              <Button type="submit">Create Column</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Column Migration Modal */}
      {columnToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setColumnToDelete(null)}
          title={`Delete Column: ${columnToDelete.name}`}
        >
          <div className="space-y-4">
            <p className="text-sm">
              This column currently has <strong>{tasks.filter(t => t.columnId === columnToDelete.id).length}</strong> tasks. 
              Please select a target column to migrate these tasks to before deletion:
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Move Tasks To</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={migrateTargetColId}
                onChange={(e) => setMigrateTargetColId(e.target.value)}
              >
                {project.columns
                  .filter(c => c.id !== columnToDelete.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setColumnToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteColumn}>Migrate Tasks & Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
