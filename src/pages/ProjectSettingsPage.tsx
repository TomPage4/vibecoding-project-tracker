import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { db } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { permissions } from '../lib/permissions';
import { exportService } from '../lib/export';
import { ProjectSubNav } from '../components/layout/ProjectSubNav';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { 
  Users, 
  Trash2, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  FileDown, 
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { Role, Column } from '../types';

export const ProjectSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const project = db.getProject(id!);

  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnCategory, setNewColumnCategory] = useState<Column['category']>('in_progress');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string>('');

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Role>('member');
  const [memberError, setMemberError] = useState('');

  const [newLabel, setNewLabel] = useState('');

  if (!project || !user) return <Navigate to="/dashboard" replace />;

  const isOwner = permissions.isOwner(project, user.id);
  const canManage = permissions.canManageProject(project, user.id);

  const tasks = db.getTasks(id);

  // Column Actions
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim() || !canManage) return;

    const newCol: Column = {
      id: crypto.randomUUID(),
      name: newColumnName.trim(),
      category: newColumnCategory,
      order: project.columns.length,
    };

    db.saveProject({
      ...project,
      columns: [...project.columns, newCol],
    });

    setNewColumnName('');
    setIsAddingColumn(false);
  };

  const handleMoveColumn = (colId: string, direction: 'up' | 'down') => {
    if (!canManage) return;
    const sorted = [...project.columns].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(c => c.id === colId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;

    const swapWith = direction === 'up' ? index - 1 : index + 1;
    const temp = sorted[index].order;
    sorted[index].order = sorted[swapWith].order;
    sorted[swapWith].order = temp;

    db.saveProject({
      ...project,
      columns: sorted,
    });
  };

  const handleUpdateColumn = (colId: string, updates: Partial<Column>) => {
    if (!canManage) return;
    const columns = project.columns.map(c => c.id === colId ? { ...c, ...updates } : c);
    // ensure at least one column has category closed
    if (!columns.some(c => c.category === 'closed')) {
      alert('At least one column must retain category "closed" for milestone tracking.');
      return;
    }
    db.saveProject({ ...project, columns });
  };

  const handleDeleteColumnRequest = (col: Column) => {
    if (!canManage) return;
    if (project.columns.length <= 1) {
      alert('A project must have at least one column.');
      return;
    }
    const isOnlyClosed = col.category === 'closed' && project.columns.filter(c => c.category === 'closed').length === 1;
    if (isOnlyClosed) {
      alert('Cannot delete the only "closed" column. At least one closed column is required.');
      return;
    }

    const tasksInCol = tasks.filter(t => t.columnId === col.id);
    if (tasksInCol.length > 0) {
      const remainingCols = project.columns.filter(c => c.id !== col.id);
      setTargetColumnId(remainingCols[0]?.id || '');
      setColumnToDelete(col);
    } else {
      const columns = project.columns.filter(c => c.id !== col.id);
      db.saveProject({ ...project, columns });
    }
  };

  const confirmDeleteColumn = () => {
    if (!columnToDelete || !targetColumnId) return;
    // Migrate tasks
    const tasksInCol = tasks.filter(t => t.columnId === columnToDelete.id);
    for (const t of tasksInCol) {
      db.saveTask({ ...t, columnId: targetColumnId });
    }
    const columns = project.columns.filter(c => c.id !== columnToDelete.id);
    db.saveProject({ ...project, columns });
    setColumnToDelete(null);
  };

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
  };

  const handleRemoveMember = (userId: string) => {
    if (!canManage) return;
    if (userId === project.ownerId) {
      alert('Cannot remove the project owner.');
      return;
    }
    const members = project.members.filter(m => m.userId !== userId);
    db.saveProject({ ...project, members });
  };

  // Label Actions
  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !canManage) return;
    const label = newLabel.trim().toLowerCase();
    if (!project.labels.includes(label)) {
      db.saveProject({ ...project, labels: [...project.labels, label] });
    }
    setNewLabel('');
  };

  const handleRemoveLabel = (label: string) => {
    if (!canManage) return;
    db.saveProject({ ...project, labels: project.labels.filter(l => l !== label) });
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
        <p className="text-muted-foreground">Manage columns, members, labels, and exports.</p>
      </div>

      <ProjectSubNav />

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
          <Button variant="outline" onClick={() => exportService.exportFullProjectJSON(project.id)}>
            Export Full Project (JSON)
          </Button>
          <Button variant="outline" onClick={() => exportService.exportTasksJSON(project.id)}>
            Export Tasks (JSON)
          </Button>
          <Button variant="outline" onClick={() => exportService.exportTasksCSV(project.id)}>
            Export Tasks (CSV)
          </Button>
          <Button variant="outline" onClick={() => exportService.exportPromptsJSON(project.id)}>
            Export Prompts (JSON)
          </Button>
          <Button variant="outline" onClick={() => exportService.exportPromptsMarkdown(project.id)}>
            Export Prompts (Markdown)
          </Button>
        </CardContent>
      </Card>

      {/* Columns Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Board Columns</CardTitle>
            <CardDescription>Add, rename, reorder, or delete workflow columns.</CardDescription>
          </div>
          {canManage && (
            <Button size="sm" onClick={() => setIsAddingColumn(!isAddingColumn)} className="gap-1">
              <Plus className="h-4 w-4" /> Add Column
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingColumn && (
            <form onSubmit={handleAddColumn} className="flex flex-wrap gap-3 p-4 bg-muted/40 rounded-lg border">
              <Input
                placeholder="Column name (e.g. QA, Staging)"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="max-w-xs"
                required
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newColumnCategory}
                onChange={(e) => setNewColumnCategory(e.target.value as any)}
              >
                <option value="open">Category: Open (To Do)</option>
                <option value="in_progress">Category: In Progress</option>
                <option value="closed">Category: Closed (Done)</option>
              </select>
              <Button type="submit">Create</Button>
              <Button variant="ghost" type="button" onClick={() => setIsAddingColumn(false)}>Cancel</Button>
            </form>
          )}

          <div className="divide-y border rounded-md overflow-hidden">
            {[...project.columns].sort((a, b) => a.order - b.order).map((col, idx, arr) => (
              <div key={col.id} className="flex items-center justify-between p-3 bg-card gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs font-mono text-muted-foreground w-6">#{idx + 1}</span>
                  <input
                    type="text"
                    defaultValue={col.name}
                    disabled={!canManage}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== col.name) {
                        handleUpdateColumn(col.id, { name: e.target.value.trim() });
                      }
                    }}
                    className="font-medium text-sm border-b border-transparent hover:border-input focus:border-primary px-1 py-0.5 bg-transparent rounded"
                  />
                  <select
                    value={col.category}
                    disabled={!canManage}
                    onChange={(e) => handleUpdateColumn(col.id, { category: e.target.value as any })}
                    className="text-xs border rounded px-2 py-1 bg-background text-muted-foreground"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className="text-xs text-muted-foreground">
                    ({tasks.filter(t => t.columnId === col.id).length} tasks)
                  </span>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => handleMoveColumn(col.id, 'up')}
                      aria-label="Move column up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === arr.length - 1}
                      onClick={() => handleMoveColumn(col.id, 'down')}
                      aria-label="Move column down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteColumnRequest(col)}
                      aria-label="Delete column"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
      {isOwner && (
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
      )}

      {/* Column Deletion Modal (Task migration) */}
      {columnToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setColumnToDelete(null)}
          title={`Delete Column: ${columnToDelete.name}`}
        >
          <div className="space-y-4">
            <p className="text-sm">
              This column contains <strong>{tasks.filter(t => t.columnId === columnToDelete.id).length}</strong> tasks.
              Choose where to move these tasks before deleting the column:
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Column</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={targetColumnId}
                onChange={(e) => setTargetColumnId(e.target.value)}
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
              <Button variant="destructive" onClick={confirmDeleteColumn}>Move Tasks & Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
