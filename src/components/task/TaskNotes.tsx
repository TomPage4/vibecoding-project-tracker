import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';

interface TaskNotesProps {
  notes: string;
  onUpdate: (notes: string) => void;
  disabled?: boolean;
}

export const TaskNotes: React.FC<TaskNotesProps> = ({ notes, onUpdate, disabled = false }) => {
  const [isEditing, setIsEditing] = useState(!notes);
  const [value, setValue] = useState(notes);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(notes);
  }, [notes]);

  const handleSave = () => {
    if (disabled) return;
    onUpdate(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(notes);
    setIsEditing(false);
  };

  // Interactive toggle of GFM checkboxes in Preview mode
  const handleToggleCheckbox = (checkboxOrdinal: number) => {
    if (disabled) return;
    let currentIdx = 0;
    const updated = value.replace(/^([ \t]*[-*+]\s+\[)([ xX])(\])/gm, (match, prefix, check, suffix) => {
      if (currentIdx === checkboxOrdinal) {
        currentIdx++;
        const newCheck = check === ' ' ? 'x' : ' ';
        return `${prefix}${newCheck}${suffix}`;
      }
      currentIdx++;
      return match;
    });

    setValue(updated);
    onUpdate(updated);
  };

  // Track ordinal checkbox index during preview rendering
  let checkboxCounter = 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Supports GitHub Flavored Markdown and interactive checklists (- [ ] task).</p>
        </div>
        {!disabled && (
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
              }, 1000);
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
          className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 min-h-[220px] bg-muted/10 leading-relaxed"
          onClick={() => { if (!notes && !disabled) setIsEditing(true); }}
        >
          {value ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                input: ({ node, ...props }) => {
                  if (props.type === 'checkbox') {
                    const currentOrdinal = checkboxCounter++;
                    return (
                      <input
                        type="checkbox"
                        checked={props.checked}
                        disabled={disabled}
                        onChange={() => handleToggleCheckbox(currentOrdinal)}
                        className="cursor-pointer mr-2 rounded border-primary h-4 w-4 text-primary focus:ring-primary align-middle"
                      />
                    );
                  }
                  return <input {...props} />;
                }
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
