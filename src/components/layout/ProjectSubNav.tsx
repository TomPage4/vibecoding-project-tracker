import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  Milestone, 
  FileText, 
  MessageSquareQuote, 
  Settings 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const ProjectSubNav: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const links = [
    { to: `/projects/${id}`, icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: `/projects/${id}/board`, icon: Kanban, label: 'Board' },
    { to: `/projects/${id}/milestones`, icon: Milestone, label: 'Milestones' },
    { to: `/projects/${id}/context`, icon: FileText, label: 'Context' },
    { to: `/projects/${id}/prompts`, icon: MessageSquareQuote, label: 'Prompts' },
    { to: `/projects/${id}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav aria-label="Project Navigation" className="flex items-center gap-1 border-b mb-6 overflow-x-auto pb-px">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
            isActive 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
};
