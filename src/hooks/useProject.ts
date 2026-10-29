import { useState, useCallback, useEffect } from 'react';
import { db, onDbUpdate } from '../lib/db';
import { Project, Task, ActivityEvent } from '../types';
import { useAuth } from './useAuth';

export const useProject = (projectId: string) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(() => db.getProject(projectId) || null);
  const [tasks, setTasks] = useState<Task[]>(() => db.getTasks(projectId));

  const refresh = useCallback(() => {
    setProject(db.getProject(projectId) || null);
    setTasks(db.getTasks(projectId));
  }, [projectId]);

  useEffect(() => {
    refresh();
    return onDbUpdate(refresh);
  }, [projectId, refresh]);

  const addTask = (
    title: string, 
    columnId: string, 
    type: 'bug' | 'feature' = 'feature', 
    labels: string[] = []
  ) => {
    if (!user) return;
    const currentTasks = db.getTasks(projectId);
    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId,
      columnId,
      order: currentTasks.filter(t => t.columnId === columnId).length,
      title,
      description: '',
      priority: 'medium',
      type: type || 'feature',
      assigneeId: null,
      milestoneId: null,
      dueDate: null,
      labels: labels || [],
      notes: '',
      requirements: [],
      aiContext: '',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveTask(newTask);
    
    const activity: ActivityEvent = {
      id: crypto.randomUUID(),
      taskId: newTask.id,
      actorId: user.id,
      type: 'created',
      from: null,
      to: null,
      createdAt: new Date().toISOString(),
    };
    db.saveActivity(activity);
    
    refresh();
  };

  const moveTask = (taskId: string, columnId: string, order: number) => {
    if (!user) return;
    const task = db.getTask(taskId);
    if (!task) return;

    const oldColumnId = task.columnId;
    if (oldColumnId !== columnId) {
      const activity: ActivityEvent = {
        id: crypto.randomUUID(),
        taskId,
        actorId: user.id,
        type: 'moved',
        from: project?.columns.find(c => c.id === oldColumnId)?.name || null,
        to: project?.columns.find(c => c.id === columnId)?.name || null,
        createdAt: new Date().toISOString(),
      };
      db.saveActivity(activity);
    }

    db.saveTask({ ...task, columnId, order, updatedAt: new Date().toISOString() });
    refresh();
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const task = db.getTask(taskId);
    if (!task) return;
    db.saveTask({ ...task, ...updates, updatedAt: new Date().toISOString() });
    refresh();
  };

  const deleteTask = (taskId: string) => {
    db.deleteTask(taskId);
    refresh();
  };

  return {
    project,
    tasks,
    addTask,
    moveTask,
    updateTask,
    deleteTask,
    refresh
  };
};
