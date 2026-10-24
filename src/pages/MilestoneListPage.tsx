import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Plus, Milestone as MilestoneIcon, Calendar } from 'lucide-react';
import { db } from '../lib/db';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { MilestoneCard } from '../components/milestone/MilestoneCard';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Milestone } from '../types';

export const MilestoneListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const project = db.getProject(id!);
  if (!project) return <Navigate to="/dashboard" replace />;

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    notes: ''
  });

  const milestones = db.getMilestones(id!).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const tasks = db.getTasks(id!);

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) return;

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
    setFormData({ title: '', dueDate: '', notes: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name} Milestones</h1>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Milestone
        </Button>
      </div>

      <ProjectSubNav />

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
          <Button onClick={() => setIsAdding(true)}>Create Your First Milestone</Button>
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
