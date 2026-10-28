import React, { useState, useEffect } from 'react';
import { 
  Anchor, 
  Pin, 
  ExternalLink, 
  AlertCircle, 
  Presentation, 
  PlaySquare, 
  FileText, 
  BookOpen 
} from 'lucide-react';
import { Project, AnchorLinks } from '../../types';
import { db } from '../../lib/db';
import { useAuth } from '../../hooks/useAuth';
import { permissions } from '../../lib/permissions';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { toast } from '../ui/Toast';
import { announce } from '../../lib/announcer';
import { cn } from '../../lib/utils';

interface AnchorBoardProps {
  project: Project;
  onUpdateProject?: (updated: Project) => void;
}

type DeliverableKey = 'presentation' | 'demo' | 'report' | 'documentation';

interface DeliverableConfig {
  id: DeliverableKey;
  name: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const DELIVERABLES: DeliverableConfig[] = [
  { id: 'presentation', name: 'Presentation', label: 'Presentation link', icon: Presentation },
  { id: 'demo', name: 'Demo', label: 'Demo link', icon: PlaySquare },
  { id: 'report', name: 'Report', label: 'Report link', icon: FileText },
  { id: 'documentation', name: 'Documentation', label: 'Documentation link', icon: BookOpen },
];

export const AnchorBoard: React.FC<AnchorBoardProps> = ({ project, onUpdateProject }) => {
  const { user } = useAuth();
  const canEdit = user ? permissions.canEditAnchorBoard(project, user.id) : false;

  const handleSaveLink = (key: DeliverableKey, url: string) => {
    if (!canEdit) return;

    const currentLinks: AnchorLinks = { ...(project.anchorLinks || {}) };
    currentLinks[key] = url;

    const updatedProject: Project = {
      ...project,
      anchorLinks: currentLinks,
    };

    db.saveProject(updatedProject);
    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }

    const deliv = DELIVERABLES.find(d => d.id === key);
    toast.success(`${deliv?.name || 'Deliverable'} link saved`);
    announce(`${deliv?.name || 'Deliverable'} link updated to ${url}`);
  };

  const handleClearLink = (key: DeliverableKey) => {
    if (!canEdit) return;

    const currentLinks: AnchorLinks = { ...(project.anchorLinks || {}) };
    delete currentLinks[key];

    const updatedProject: Project = {
      ...project,
      anchorLinks: currentLinks,
    };

    db.saveProject(updatedProject);
    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }

    const deliv = DELIVERABLES.find(d => d.id === key);
    toast.info(`${deliv?.name || 'Deliverable'} link cleared`);
    announce(`${deliv?.name || 'Deliverable'} link cleared`);
  };

  return (
    <section aria-labelledby="anchor-board-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 id="anchor-board-heading" className="text-lg font-bold tracking-tight">
            Anchor Board
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {canEdit 
            ? 'Team-shared project deliverable links' 
            : 'View-only deliverable links (viewers cannot edit)'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DELIVERABLES.map((deliv) => {
          const savedLink = project.anchorLinks?.[deliv.id] || '';
          return (
            <AnchorDeliverableCard
              key={deliv.id}
              config={deliv}
              savedLink={savedLink}
              canEdit={canEdit}
              onSave={(url) => handleSaveLink(deliv.id, url)}
              onClear={() => handleClearLink(deliv.id)}
            />
          );
        })}
      </div>
    </section>
  );
};

interface AnchorDeliverableCardProps {
  config: DeliverableConfig;
  savedLink: string;
  canEdit: boolean;
  onSave: (url: string) => void;
  onClear: () => void;
}

const AnchorDeliverableCard: React.FC<AnchorDeliverableCardProps> = ({
  config,
  savedLink,
  canEdit,
  onSave,
  onClear,
}) => {
  const [inputValue, setInputValue] = useState(savedLink);
  const [error, setError] = useState('');

  // Synchronize input value with project anchorLinks whenever changed (e.g. team member update or live update)
  useEffect(() => {
    setInputValue(savedLink);
    setError('');
  }, [savedLink]);

  const validateUrl = (url: string): { isValid: boolean; error: string; formattedUrl: string } => {
    const trimmed = url.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Link cannot be empty. Enter a URL or click Clear.', formattedUrl: '' };
    }

    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      return {
        isValid: false,
        error: 'Unsafe URL scheme rejected. Only http:// and https:// URLs are allowed.',
        formattedUrl: ''
      };
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return {
          isValid: false,
          error: 'URL must start with http:// or https://',
          formattedUrl: ''
        };
      }
      return { isValid: true, error: '', formattedUrl: parsed.toString() };
    } catch (_) {
      return {
        isValid: false,
        error: 'Please enter a valid URL starting with http:// or https://',
        formattedUrl: ''
      };
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const validation = validateUrl(inputValue);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError('');
    onSave(validation.formattedUrl);
  };

  const handleClearClick = () => {
    if (!canEdit) return;
    setInputValue('');
    setError('');
    onClear();
  };

  const Icon = config.icon;
  const isLinked = Boolean(savedLink);

  return (
    <div className="rounded-lg border bg-card p-4 transition-all shadow-sm flex flex-col justify-between gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0" aria-hidden="true">
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-foreground">{config.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Pin className="h-3 w-3 text-muted-foreground rotate-45 shrink-0" aria-label="Pinned deliverable" />
          {isLinked ? (
            <StatusBadge variant="done" label="Linked" />
          ) : (
            <StatusBadge variant="neutral" label="Not set" />
          )}
        </div>
      </div>

      {/* Saved Clickable Link Display or Empty State */}
      <div className="min-h-[44px] flex items-center">
        {isLinked ? (
          <div className="w-full rounded-md border bg-muted/20 p-2 flex items-center justify-between gap-2 overflow-hidden">
            <a
              href={savedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label={`Open ${config.name} link: ${savedLink} in new tab`}
              title={savedLink}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{savedLink}</span>
            </a>
            <a
              href={savedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground hover:text-foreground shrink-0 underline ml-1"
            >
              Open
            </a>
          </div>
        ) : (
          <div className="w-full rounded-md border border-dashed p-2 text-center bg-muted/10">
            <p className="text-xs text-muted-foreground italic">No link added yet</p>
          </div>
        )}
      </div>

      {/* Exactly One Link Input Field with Visible Label */}
      <form onSubmit={handleFormSubmit} className="space-y-1.5 pt-1 border-t">
        <label
          htmlFor={`anchor-link-${config.id}`}
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {config.label}
        </label>
        <div className="flex gap-1.5 items-center">
          <input
            id={`anchor-link-${config.id}`}
            type="url"
            disabled={!canEdit}
            placeholder={canEdit ? "https://..." : "Read-only for viewers"}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError('');
            }}
            className={cn(
              "flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `error-${config.id}` : undefined}
          />
          {canEdit && (
            <Button
              type="submit"
              size="sm"
              className="h-8 px-2.5 text-xs shrink-0"
              disabled={!inputValue.trim() || inputValue === savedLink}
              aria-label={`Save ${config.name} link`}
            >
              Save
            </Button>
          )}
          {canEdit && isLinked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearClick}
              className="h-8 px-2 text-xs text-destructive hover:text-destructive shrink-0"
              aria-label={`Clear ${config.name} link`}
              title={`Clear ${config.name} link`}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Screen-reader live error notification */}
        {error && (
          <div
            id={`error-${config.id}`}
            role="alert"
            aria-live="polite"
            className="flex items-center gap-1 text-[11px] font-medium text-destructive mt-1"
          >
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!canEdit && (
          <p className="text-[10px] text-muted-foreground italic mt-0.5">
            Viewers cannot edit anchor links
          </p>
        )}
      </form>
    </div>
  );
};
