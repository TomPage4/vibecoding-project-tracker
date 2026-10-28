import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface TaskNotesProps {
  notes: string;
  onUpdate: (notes: string) => void;
  disabled?: boolean;
}

export const TaskNotes: React.FC<TaskNotesProps> = ({ notes, onUpdate, disabled = false }) => {
  const [isEditing, setIsEditing] = useState(!notes);
  const [value, setValue] = useState(notes || '');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(notes || '');
  }, [notes]);

  const handleSave = () => {
    if (disabled) return;
    onUpdate(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(notes || '');
    setIsEditing(false);
  };

  // Interactive toggle of GFM checkboxes in Preview mode
  const handleToggleLine = (lineNum?: number) => {
    if (disabled || !lineNum) return;
    const lines = value.split('\n');
    const targetIdx = lineNum - 1;
    if (targetIdx >= 0 && targetIdx < lines.length) {
      const line = lines[targetIdx];
      const updatedLine = line.replace(/(\[)([ xX])(\])/, (_, open, mark, close) => {
        const nextMark = mark === ' ' ? 'x' : ' ';
        return `${open}${nextMark}${close}`;
      });
      lines[targetIdx] = updatedLine;
      const updated = lines.join('\n');
      setValue(updated);
      onUpdate(updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
        </div>
        {disabled ? (
          <span className="text-xs text-muted-foreground italic">
            You don't have permission to edit notes or toggle checklists
          </span>
        ) : (
          <div className="flex gap-1 border rounded-md p-0.5 bg-muted/30">
            <Button 
              variant={!isEditing ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 px-2.5 gap-1 text-xs"
              onClick={() => setIsEditing(false)}
            >
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <Button 
              variant={isEditing ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 px-2.5 gap-1 text-xs"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-3 w-3" /> Edit
            </Button>
          </div>
        )}
      </div>

      {isEditing && !disabled ? (
        <div className="space-y-3">
          <textarea
            className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring monospace"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              setValue(val);
              // Debounced update
              if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = setTimeout(() => {
                onUpdate(val);
              }, 800);
            }}
            placeholder="Add detailed markdown notes, code snippets, or checklists (e.g. - [ ] item)..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Notes</Button>
          </div>
        </div>
      ) : (
        <div 
          className="max-w-none border rounded-md p-4 min-h-[220px] bg-muted/10 leading-relaxed text-foreground"
          onClick={() => { if (!notes && !disabled) setIsEditing(true); }}
        >
          {value ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2 pb-1 border-b text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mt-2.5 mb-1.5 text-foreground">{children}</h3>,
                h4: ({ children }) => <h4 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h4>,
                h5: ({ children }) => <h5 className="text-sm font-semibold mt-1.5 mb-1 text-foreground uppercase tracking-wide">{children}</h5>,
                h6: ({ children }) => <h6 className="text-xs font-semibold mt-1.5 mb-0.5 text-muted-foreground uppercase tracking-wider">{children}</h6>,
                p: ({ children }) => <p className="mb-2 leading-relaxed text-sm text-foreground last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children, className }) => (
                  <ul className={cn("space-y-1 mb-2 text-sm", className?.includes('contains-task-list') ? "list-none pl-0" : "list-disc pl-5")}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2 text-sm">{children}</ol>,
                li: ({ node, children, className, ...props }) => {
                  const isTaskItem = className?.includes('task-list-item');
                  if (isTaskItem && Array.isArray(children)) {
                    const firstChild = children[0];
                    if (firstChild && typeof firstChild === 'object' && 'props' in firstChild && firstChild.props?.type === 'checkbox') {
                      const isChecked = Boolean(firstChild.props.checked);
                      const lineNum = node?.position?.start?.line;
                      return (
                        <li className={cn("flex items-start gap-2 list-none my-1", className)}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() => handleToggleLine(lineNum)}
                            className="mt-1 h-4 w-4 rounded border-primary text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed shrink-0"
                            aria-label={`Toggle task: ${children.slice(1).map(c => typeof c === 'string' ? c : '').join('').trim()}`}
                          />
                          <span className={cn("flex-1 text-sm", isChecked && "line-through text-muted-foreground")}>
                            {children.slice(1)}
                          </span>
                        </li>
                      );
                    }
                  }
                  return <li className={cn("text-sm", className)} {...props}>{children}</li>;
                },
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">
                    {children}
                  </a>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-medium text-foreground" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={cn("block bg-muted/80 p-3 rounded-md text-xs font-mono overflow-x-auto text-foreground", className)} {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-3 italic my-2 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-4 border-border" />
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic text-center py-12">
              {disabled ? 'No notes added for this task.' : 'No notes yet. Click Edit to add some.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
