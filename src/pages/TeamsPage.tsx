import React, { useState } from 'react';
import { Plus, Users, UserPlus, Shield, Trash2 } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  if (!user) return null;

  const teams = db.getTeams().filter(t => t.memberIds.includes(user.id));

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newTeam = {
      id: crypto.randomUUID(),
      name: newTeamName,
      memberIds: [user.id],
      ownerId: user.id,
      createdAt: new Date().toISOString(),
    };

    db.saveTeam(newTeam);
    setNewTeamName('');
    setIsCreating(false);
  };

  const handleInvite = (teamId: string) => {
    const invitee = db.getUserByEmail(inviteEmail);
    if (!invitee) {
      alert('User not found. They must register first.');
      return;
    }

    const team = db.getTeam(teamId);
    if (team && !team.memberIds.includes(invitee.id)) {
      team.memberIds.push(invitee.id);
      db.saveTeam(team);
      setInviteEmail('');
      setActiveTeamId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage your teams and collaborate with others.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Team
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create a New Team</CardTitle>
            <CardDescription>Teams allow you to group people and projects together.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="flex gap-4">
              <Input
                placeholder="Team Name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                autoFocus
              />
              <Button type="submit">Create</Button>
              <Button variant="outline" type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {teams.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No teams yet</h2>
            <p className="text-muted-foreground mb-4">You are currently working solo. Create a team to collaborate.</p>
            <Button onClick={() => setIsCreating(true)}>Create Your First Team</Button>
          </Card>
        ) : (
          teams.map(team => (
            <Card key={team.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>Created {new Date(team.createdAt).toLocaleDateString()}</CardDescription>
                </div>
                {team.ownerId === user.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setActiveTeamId(activeTeamId === team.id ? null : team.id)}
                  >
                    <UserPlus className="h-4 w-4" /> Invite Member
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTeamId === team.id && (
                  <div className="flex gap-2 p-3 bg-muted rounded-md mb-4">
                    <Input
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-background"
                    />
                    <Button onClick={() => handleInvite(team.id)}>Invite</Button>
                  </div>
                )}

                <div className="divide-y">
                  {team.memberIds.map(memberId => {
                    const member = db.getUser(memberId);
                    if (!member) return null;
                    return (
                      <div key={memberId} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {team.ownerId === memberId && (
                            <Badge variant="secondary" className="gap-1">
                              <Shield className="h-3 w-3" /> Owner
                            </Badge>
                          )}
                          {team.ownerId === user.id && memberId !== user.id && (
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
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
          ))
        )}
      </div>
    </div>
  );
};
