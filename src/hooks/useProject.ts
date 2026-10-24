import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { Project, Task, ActivityEvent } from '../types';
import { useAuth } from './useAuth';

export const useProject = (projectId: string) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(db.getProject(projectId) || null);
  const [tasks, setTasks] = useState<Task[]>(db.getTasks(projectId));

  const refresh = useCallback(() => {
    setProject(db.getProject(projectId) || null);
    setTasks(db.getTasks(projectId));
  }, [projectId]);

  const addTask = (title: string, columnId: string) => {
    if (!user) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId,
      columnId,
      order: tasks.filter(t => t.columnId === columnId).length,
      title,
      description: '',
      priority: 'medium',
      assigneeId: null,
      milestoneId: null,
      labels: [],
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
