import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { db, onDbUpdate } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { permissions } from '../lib/permissions';
import { exportService } from '../lib/export';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { 
  Users, 
  Trash2, 
  FileDown, 
  AlertTriangle,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { Role } from '../types';

export const ProjectSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(() => db.getProject(id!));

  useEffect(() => {
    const update = () => {
      setProject(db.getProject(id!));
    };
    update();
    return onDbUpdate(update);
  }, [id]);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Role>('member');
  const [memberError, setMemberError] = useState('');

  const [newLabel, setNewLabel] = useState('');

  if (!project || !user) return <Navigate to="/dashboard" replace />;

  const isOwner = permissions.isOwner(project, user.id);
  const canManage = permissions.canManageProject(project, user.id);
  const isViewer = permissions.isViewer(project, user.id);

  // Member Actions
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    if (!canManage) return;

    const targetUser = db.getUserByEmail(newMemberEmail.trim());
    if (!targetUser) {
      setMemberError('User with that email does not exist. They must register first.');
      return;
    }

    if (project.members.some(m => m.userId === targetUser.id)) {
      setMemberError('User is already a member of this project.');
      return;
    }

    const updatedMembers = [...project.members, { userId: targetUser.id, role: newMemberRole }];
    db.saveProject({ ...project, members: updatedMembers });
    toast.success(`Added ${targetUser.name} to project`);
    setNewMemberEmail('');
  };

  const handleUpdateRole = (userId: string, role: Role) => {
    if (!canManage) return;
    if (userId === project.ownerId) {
      alert('Cannot change the role of the project owner.');
      return;
    }
    const members = project.members.map(m => m.userId === userId ? { ...m, role } : m);
    db.saveProject({ ...project, members });
    toast.success('Member role updated');
  };

  const handleRemoveMember = (userId: string) => {
    if (!canManage) return;
    if (userId === project.ownerId) {
      alert('Cannot remove the project owner.');
      return;
    }
    const members = project.members.filter(m => m.userId !== userId);
    db.saveProject({ ...project, members });
    toast.info('Member removed from project');
  };

  // Label Actions
  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !canManage) return;
    const label = newLabel.trim().toLowerCase();
    if (!project.labels.includes(label)) {
      db.saveProject({ ...project, labels: [...project.labels, label] });
      toast.success(`Label "${label}" added`);
    }
    setNewLabel('');
  };

  const handleRemoveLabel = (label: string) => {
    if (!canManage) return;
    db.saveProject({ ...project, labels: project.labels.filter(l => l !== label) });
    toast.info(`Label "${label}" removed`);
  };

  // Project Deletion
  const handleDeleteProject = () => {
    if (!isOwner) return;
    const confirmName = prompt(`To delete this project, type "${project.name}" below:`);
    if (confirmName === project.name) {
      db.deleteProject(project.id);
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name} Settings</h1>
        <p className="text-muted-foreground">Manage members, labels, and exports.</p>
      </div>

      <ProjectSubNav />

      {/* Viewer mode notification banner */}
      {isViewer && (
        <div className="flex items-center gap-2 p-3 bg-muted/60 border rounded-lg text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
          <span>
            <strong>Limited Access:</strong> You can only export project data. You don't have permission to edit project members, labels, and deletion controls.
          </span>
        </div>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" /> Export Project Data
          </CardTitle>
          <CardDescription>
            Download client-side backup files of your tasks, prompts, or the entire project dataset.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => {
            exportService.exportFullProjectJSON(project.id);
            toast.success('Full project JSON exported');
          }}>
            Export Full Project (JSON)
          </Button>
          <Button variant="outline" onClick={() => {
            exportService.exportTasksJSON(project.id);
            toast.success('Tasks JSON exported');
          }}>
            Export Tasks (JSON)
          </Button>
          <Button variant="outline" onClick={() => {
            exportService.exportTasksCSV(project.id);
            toast.success('Tasks CSV exported');
          }}>
            Export Tasks (CSV)
          </Button>
          <Button variant="outline" onClick={() => {
            exportService.exportPromptsJSON(project.id);
            toast.success('Prompts JSON exported');
          }}>
            Export Prompts (JSON)
          </Button>
          <Button variant="outline" onClick={() => {
            exportService.exportPromptsMarkdown(project.id);
            toast.success('Prompts Markdown exported');
          }}>
            Export Prompts (Markdown)
          </Button>
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Members & Roles
          </CardTitle>
          <CardDescription>
            Control who has access to view, edit, or administer this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!canManage && (
            <p className="text-xs text-muted-foreground italic">
              You don't have permission to invite members or alter project roles
            </p>
          )}

          {canManage && (
            <form onSubmit={handleAddMember} className="space-y-2">
              <div className="flex flex-wrap gap-3">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="max-w-xs"
                  required
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as Role)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button type="submit" className="gap-1">
                  <UserPlus className="h-4 w-4" /> Add Member
                </Button>
              </div>
              {memberError && <p className="text-xs text-destructive">{memberError}</p>}
            </form>
          )}

          <div className="divide-y border rounded-md overflow-hidden">
            {project.members.map(member => {
              const u = db.getUser(member.userId);
              if (!u) return null;
              const isProjOwner = member.userId === project.ownerId;

              return (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-card">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {u.name}
                        {u.id === user.id && <span className="text-xs text-muted-foreground font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isProjOwner ? (
                      <Badge variant="secondary">Owner</Badge>
                    ) : (
                      <select
                        value={member.role}
                        disabled={!canManage}
                        onChange={(e) => handleUpdateRole(member.userId, e.target.value as Role)}
                        className="text-xs rounded border px-2 py-1 bg-background"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}

                    {canManage && !isProjOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(member.userId)}
                        aria-label="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Labels Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Labels</CardTitle>
          <CardDescription>Vocabulary of tags used across cards and tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage && (
            <p className="text-xs text-muted-foreground italic">
              You don't have permission to create or remove project labels
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {project.labels.map(label => (
              <Badge key={label} variant="outline" className="text-xs py-1 px-2.5 gap-1.5">
                {label}
                {canManage && (
                  <button
                    onClick={() => handleRemoveLabel(label)}
                    className="hover:text-destructive transition-colors ml-1"
                    aria-label={`Remove label ${label}`}
                  >
                    &times;
                  </button>
                )}
              </Badge>
            ))}
          </div>

          {canManage && (
            <form onSubmit={handleAddLabel} className="flex gap-2 max-w-sm pt-2">
              <Input
                placeholder="New label name..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-9"
              />
              <Button type="submit" size="sm">Add</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this project and all associated tasks, prompts, tool errors, and history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-muted bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this project and all associated tasks, prompts, tool errors, and history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled className="opacity-40 cursor-not-allowed">
              Delete Project
            </Button>
            <p className="text-xs text-muted-foreground italic mt-2">
              Only the project owner can delete this project.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
