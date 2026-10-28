import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Users, FolderKanban, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/db';
import { loadDemoData } from '../lib/seed';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loadingDemo, setLoadingDemo] = useState(false);
  
  if (!user) return null;

  const projects = db.getProjects().filter(p => 
    p.members.some(m => m.userId === user.id)
  );

  const soloProjects = projects.filter(p => p.teamId === null);
  const teamProjects = projects.filter(p => p.teamId !== null);

  const handleLoadDemoData = async () => {
    setLoadingDemo(true);
    try {
      await loadDemoData();
      window.location.reload();
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">
            Here's an overview of your projects and activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleLoadDemoData} disabled={loadingDemo} className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {loadingDemo ? 'Loading Demo Data...' : 'Load Demo Data'}
          </Button>
          <Link to="/projects/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Get started by creating your first project or loading demo data to see how SlopForge works.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleLoadDemoData} disabled={loadingDemo}>
              {loadingDemo ? 'Loading...' : 'Load Demo Data'}
            </Button>
            <Link to="/projects/new">
              <Button>Create Project</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {soloProjects.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Solo Projects</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {soloProjects.map(p => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          {teamProjects.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Team Projects</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamProjects.map(p => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

const ProjectCard: React.FC<{ project: any }> = ({ project }) => {
  const tasks = db.getTasks(project.id);
  const openTasks = tasks.filter(t => {
    const col = project.columns.find((c: any) => c.id === t.columnId);
    return col && col.category !== 'closed';
  }).length;

  return (
    <Link to={`/projects/${project.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <Card className="h-full hover:border-primary/50 transition-all hover:shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <Badge variant="outline">{project.teamId ? 'Team' : 'Solo'}</Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{tasks.length} tasks</span>
            <span>{openTasks} open</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${tasks.length > 0 ? ((tasks.length - openTasks) / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
