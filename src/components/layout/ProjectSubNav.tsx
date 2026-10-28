import React from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import { 
  Kanban,
  LayoutDashboard, 
  Milestone, 
  FileText, 
  MessageSquareQuote, 
  Settings 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const ProjectSubNav: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const links = [
    { to: `/projects/${id}/board`, icon: Kanban, label: 'Board' },
    { to: `/projects/${id}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `/projects/${id}/milestones`, icon: Milestone, label: 'Milestones' },
    { to: `/projects/${id}/context`, icon: FileText, label: 'Context' },
    { to: `/projects/${id}/prompts`, icon: MessageSquareQuote, label: 'Prompts' },
    { to: `/projects/${id}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav aria-label="Project Navigation" className="flex items-center gap-1 border-b mb-6 overflow-x-auto py-1">
      {links.map((link) => {
        const isBoard = link.to === `/projects/${id}/board`;
        const isTaskDetail = isBoard && location.pathname.startsWith(`/projects/${id}/tasks`);
        const isBoardActive = isBoard && (location.pathname.startsWith(`/projects/${id}/board`) || isTaskDetail);

        return (
          <NavLink
            key={link.to}
            to={link.to}
            aria-current={isBoard ? (isBoardActive ? 'page' : undefined) : undefined}
            className={({ isActive }) => {
              const active = isActive || isTaskDetail;
              return cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                active 
                  ? "border-primary text-primary font-semibold" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              );
            }}
          >
            <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
