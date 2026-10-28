import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/db';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Column } from '../types';

export const ProjectNewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSolo, setIsSolo] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);

  if (!user) return null;

  const teams = db.getTeams().filter(t => t.memberIds.includes(user.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const defaultColumns: Column[] = [
      { id: crypto.randomUUID(), name: 'To Do', category: 'open', order: 0 },
      { id: crypto.randomUUID(), name: 'In Progress', category: 'in_progress', order: 1 },
      { id: crypto.randomUUID(), name: 'Review', category: 'in_progress', order: 2 },
      { id: crypto.randomUUID(), name: 'Done', category: 'closed', order: 3 },
    ];

    const project = {
      id: crypto.randomUUID(),
      name,
      description,
      teamId: isSolo ? null : teamId,
      ownerId: user.id,
      members: [{ userId: user.id, role: 'owner' as const }],
      columns: defaultColumns,
      labels: ['bug', 'feature', 'enhancement', 'documentation'],
      context: {
        summary: '',
        techStack: '',
        functionalRequirements: '',
        nonFunctionalRequirements: '',
        dataRequirements: '',
        databaseNotes: '',
        extraNotes: '',
        updatedAt: null,
      },
      createdAt: new Date().toISOString(),
    };

    db.saveProject(project);
    navigate(`/projects/${project.id}/board`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create New Project</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Give your project a name and description to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Project Name"
              placeholder="My Awesome App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="A brief overview of what you're building..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Project Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsSolo(true)}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent ${isSolo ? 'border-primary bg-accent' : 'border-muted bg-transparent'}`}
                >
                  <span className="font-semibold text-sm">Solo Project</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Just you working on this</span>
                </button>
                <button
                  type="button"
                  disabled={teams.length === 0}
                  onClick={() => setIsSolo(false)}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed ${!isSolo ? 'border-primary bg-accent' : 'border-muted bg-transparent'}`}
                >
                  <span className="font-semibold text-sm">Team Project</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Collaborate with your team</span>
                </button>
              </div>
              {teams.length === 0 && !isSolo && (
                <p className="text-xs text-destructive">You don't belong to any teams yet.</p>
              )}
            </div>

            {!isSolo && teams.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Select Team</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={teamId || ''}
                  onChange={(e) => setTeamId(e.target.value || null)}
                  required
                >
                  <option value="">Select a team...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit">Create Project</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
