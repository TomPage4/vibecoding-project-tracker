import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { ToolError } from '../../types';
import { db, onDbUpdate } from '../../lib/db';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { dateUtils } from '../../lib/dates';
import { cn } from '../../lib/utils';
import { announce } from '../../lib/announcer';
import { toast } from '../ui/Toast';

interface TaskErrorsProps {
  taskId: string;
  disabled?: boolean;
}

export const TaskErrors: React.FC<TaskErrorsProps> = ({ taskId, disabled = false }) => {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tool: '',
    errorText: '',
    description: '',
  });

  const [errors, setErrors] = useState<ToolError[]>(() =>
    db.getErrors(taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  useEffect(() => {
    const update = () => {
      setErrors(db.getErrors(taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    update();
    return onDbUpdate(update);
  }, [taskId]);

  const handleAddError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || disabled) return;

    const newError: ToolError = {
      id: crypto.randomUUID(),
      taskId,
      tool: formData.tool || 'Unknown',
      errorText: formData.errorText,
      description: formData.description,
      resolved: false,
      resolution: '',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    db.saveError(newError);
    db.saveActivity({
      id: crypto.randomUUID(),
      taskId,
      actorId: user.id,
      type: 'error_logged',
      from: null,
      to: newError.tool,
      createdAt: new Date().toISOString()
    });

    setErrors(prev => [newError, ...prev.filter(e => e.id !== newError.id)]);
    toast.error(`Tool error logged (${newError.tool})`);
    announce(`Tool error logged for ${newError.tool}`);
    setFormData({ tool: '', errorText: '', description: '' });
    setIsAdding(false);
    setExpandedId(newError.id);
  };

  const handleToggleResolved = (error: ToolError) => {
    if (disabled) return;
    const nextResolved = !error.resolved;
    const updated: ToolError = { ...error, resolved: nextResolved };
    db.saveError(updated);
    setErrors(prev => prev.map(e => e.id === error.id ? updated : e));
    if (nextResolved) {
      toast.success(`Error for ${error.tool} marked as resolved`);
      announce(`Error for ${error.tool} marked as resolved`);
    } else {
      toast.info(`Error for ${error.tool} marked as unresolved`);
      announce(`Error for ${error.tool} marked as unresolved`);
    }
  };

  const handleUpdateResolution = (error: ToolError, resolution: string) => {
    if (disabled) return;
    const updated: ToolError = { ...error, resolution };
    db.saveError(updated);
    setErrors(prev => prev.map(e => e.id === error.id ? updated : e));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tool Errors</h3>
        {disabled ? (
          <div className="flex items-center gap-2">
            <Button disabled size="sm" variant="outline" className="gap-1 opacity-50 cursor-not-allowed">
              <Plus className="h-4 w-4" /> Log Error
            </Button>
            <span className="text-xs text-muted-foreground italic">
              You don't have permission to log or resolve errors
            </span>
          </div>
        ) : !isAdding ? (
          <Button onClick={() => setIsAdding(true)} size="sm" variant="destructive" className="gap-1">
            <Plus className="h-4 w-4" /> Log Error
          </Button>
        ) : null}
      </div>

      {isAdding && !disabled && (
        <form onSubmit={handleAddError} className="space-y-4 border border-destructive/20 rounded-lg p-4 bg-destructive/5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tool</label>
            <Input 
              placeholder="e.g. Cursor, Lovable, v0" 
              value={formData.tool}
              onChange={(e) => setFormData({...formData, tool: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Error Message / Stack Trace</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm monospace"
              value={formData.errorText}
              onChange={(e) => setFormData({...formData, errorText: e.target.value})}
              placeholder="Paste the error here..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">What happened?</label>
            <textarea
              className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What were you doing when this happened?"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" type="submit">Log Error</Button>
          </div>
        </form>
      )}

      {errors.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No errors logged for this task. Great job!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map(err => (
            <div key={err.id} className={cn(
              "border rounded-lg overflow-hidden bg-card",
              !err.resolved && "border-destructive/30"
            )}>
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/30"
                onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
              >
                <div className="flex items-center gap-3">
                  {err.resolved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                  <div>
                    <p className="text-sm font-semibold">{err.tool}</p>
                    <p className="text-[10px] text-muted-foreground">{dateUtils.formatDate(err.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={err.resolved ? 'success' : 'destructive'}>
                    {err.resolved ? 'Resolved' : 'Active'}
                  </Badge>
                  {expandedId === err.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {expandedId === err.id && (
                <div className="p-4 border-t space-y-4 bg-muted/10">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Error Details</label>
                    <pre className="p-3 rounded bg-muted text-xs overflow-x-auto whitespace-pre-wrap monospace border border-destructive/10">
                      {err.errorText}
                    </pre>
                  </div>

                  {err.description && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                      <p className="text-sm p-3 border rounded bg-background">{err.description}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Resolution</label>
                      <button 
                        type="button"
                        disabled={disabled}
                        onClick={() => handleToggleResolved(err)}
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded transition-colors",
                          err.resolved ? "bg-emerald-500 text-white" : "bg-secondary hover:bg-secondary/80",
                          disabled && "opacity-50 cursor-not-allowed hover:bg-secondary"
                        )}
                        title={disabled ? "You don't have permission to change error status" : undefined}
                      >
                        {err.resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                      </button>
                    </div>
                    <textarea
                      disabled={disabled}
                      className={cn(
                        "flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        disabled && "opacity-60 cursor-not-allowed bg-muted/30"
                      )}
                      value={err.resolution}
                      onChange={(e) => handleUpdateResolution(err, e.target.value)}
                      placeholder={disabled ? "You don't have permission to edit resolution notes" : "How was this fixed?"}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
