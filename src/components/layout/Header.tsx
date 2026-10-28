import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User as UserIcon, Plus, ChevronDown, Users } from 'lucide-react';
import { AnvilIcon } from '../ui/AnvilIcon';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/Button';
import { db } from '../../lib/db';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Extract current project ID from path if present
  const projectMatch = location.pathname.match(/\/projects\/([a-zA-Z0-9_-]+)/);
  const currentProjectId = projectMatch ? projectMatch[1] : null;

  const projects = user ? db.getProjects().filter(p => 
    p.members.some(m => m.userId === user.id)
  ) : [];

  const currentProject = currentProjectId ? projects.find(p => p.id === currentProjectId) : null;

  const soloProjects = projects.filter(p => p.teamId === null);
  const teamProjects = projects.filter(p => p.teamId !== null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProjectMenuOpen(false);
    };
    if (isProjectMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProjectMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-foreground group" aria-label="SlopForge Dashboard">
            <AnvilIcon className="h-6 w-6 text-primary transition-transform group-hover:scale-105" aria-hidden="true" />
            <span className="hidden sm:inline tracking-tight font-extrabold">SlopForge</span>
          </Link>

          {user && (
            <div className="flex items-center gap-2">
              {/* Project Switcher */}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 font-medium text-xs sm:text-sm max-w-[200px]"
                  onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                  aria-expanded={isProjectMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Switch project"
                >
                  <span className="truncate">
                    {currentProject ? currentProject.name : 'Projects'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70 shrink-0" />
                </Button>
                
                {isProjectMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsProjectMenuOpen(false)} 
                      aria-hidden="true"
                    />
                    <div 
                      role="menu"
                      aria-label="Projects list"
                      className="absolute top-full left-0 z-30 mt-1 w-64 rounded-md border bg-popover p-1.5 shadow-lg text-popover-foreground text-xs"
                    >
                      {soloProjects.length > 0 && (
                        <div>
                          <div className="px-2 py-1 font-bold uppercase text-[10px] text-muted-foreground">Solo Projects</div>
                          {soloProjects.map(p => (
                            <Link
                              key={p.id}
                              to={`/projects/${p.id}/board`}
                              role="menuitem"
                              className={`flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground ${currentProjectId === p.id ? 'bg-accent/60 font-semibold text-primary' : ''}`}
                              onClick={() => setIsProjectMenuOpen(false)}
                            >
                              <span className="truncate">{p.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {teamProjects.length > 0 && (
                        <div className="mt-1 pt-1 border-t">
                          <div className="px-2 py-1 font-bold uppercase text-[10px] text-muted-foreground">Team Projects</div>
                          {teamProjects.map(p => (
                            <Link
                              key={p.id}
                              to={`/projects/${p.id}/board`}
                              role="menuitem"
                              className={`flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground ${currentProjectId === p.id ? 'bg-accent/60 font-semibold text-primary' : ''}`}
                              onClick={() => setIsProjectMenuOpen(false)}
                            >
                              <span className="truncate">{p.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {projects.length === 0 && (
                        <div className="px-2 py-2 text-muted-foreground italic text-center">No projects yet</div>
                      )}

                      <div className="my-1 border-t" />
                      <Link
                        to="/projects/new"
                        role="menuitem"
                        className="flex items-center gap-2 rounded px-2 py-1.5 font-medium text-primary hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setIsProjectMenuOpen(false)}
                      >
                        <Plus className="h-4 w-4" /> New Project
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <Link to="/teams">
                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Users className="h-4 w-4" /> Teams
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          
          {user && (
            <div className="flex items-center gap-1 border-l pl-2 sm:pl-3">
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="h-9 w-9" title={`Profile: ${user.name}`} aria-label="Profile Settings">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => { logout(); navigate('/login'); }} 
                title="Logout"
                aria-label="Log out of account"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
