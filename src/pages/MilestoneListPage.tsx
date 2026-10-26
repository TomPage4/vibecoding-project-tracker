import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Plus, Milestone as MilestoneIcon, Calendar, AlertCircle } from 'lucide-react';
import { db, onDbUpdate } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { permissions } from '../lib/permissions';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { MilestoneCard } from '../components/milestone/MilestoneCard';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Milestone } from '../types';
import { toast } from '../components/ui/Toast';

export const MilestoneListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const project = db.getProject(id!);
  if (!project) return <Navigate to="/dashboard" replace />;

  const canManage = user ? permissions.canManageMilestones(project, user.id) : false;

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    notes: ''
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() =>
    db.getMilestones(id!).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  );

  useEffect(() => {
    const update = () => {
      setMilestones(db.getMilestones(id!).sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
    };
    update();
    return onDbUpdate(update);
  }, [id]);

  const tasks = db.getTasks(id!);

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !formData.title || !formData.dueDate) return;

    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      projectId: id!,
      title: formData.title,
      notes: formData.notes,
      dueDate: formData.dueDate,
      color: null,
      createdAt: new Date().toISOString(),
    };

    db.saveMilestone(newMilestone);
    toast.success(`Milestone "${newMilestone.title}" created`);
    setFormData({ title: '', dueDate: '', notes: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name} Milestones</h1>
        </div>
        {canManage ? (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Milestone
          </Button>
        ) : (
          <div className="flex flex-col items-start sm:items-end">
            <Button disabled className="gap-2 opacity-50 cursor-not-allowed">
              <Plus className="h-4 w-4" /> New Milestone
            </Button>
            <span className="text-[11px] text-muted-foreground mt-1">
              You don't have permission to create milestones
            </span>
          </div>
        )}
      </div>

      <ProjectSubNav />

      {!canManage && (
        <div className="flex items-center gap-2 p-2.5 px-3 bg-muted/60 border rounded-lg text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
          <span>
            <strong>Limited Access:</strong> You don't have permission to create, edit, or delete milestones.
          </span>
        </div>
      )}

      {isAdding && (
        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleAddMilestone}>
            <CardHeader>
              <CardTitle>Create Milestone</CardTitle>
              <CardDescription>Set a goal and deadline for your project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Milestone Title"
                placeholder="v1.0 Release, MVP, Frontend Refactor..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                autoFocus
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="What does this milestone cover?"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit">Create Milestone</Button>
            </div>
          </form>
        </Card>
      )}

      {milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
          <MilestoneIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold">No milestones yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Break your project down into milestones to track high-level progress.
          </p>
          <Button
            onClick={() => setIsAdding(true)}
            disabled={!canManage}
            className={!canManage ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Create Your First Milestone
        </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.map(m => (
            <MilestoneCard key={m.id} milestone={m} tasks={tasks} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
