import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Requirement } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

interface TaskRequirementsProps {
  requirements: Requirement[];
  onUpdate: (requirements: Requirement[]) => void;
}

export const TaskRequirements: React.FC<TaskRequirementsProps> = ({ requirements, onUpdate }) => {
  const [newReq, setNewReq] = useState('');

  const addRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.trim()) return;
    
    const updated = [
      ...requirements,
      { id: crypto.randomUUID(), text: newReq.trim(), done: false }
    ];
    onUpdate(updated);
    setNewReq('');
  };

  const toggleRequirement = (id: string) => {
    const updated = requirements.map(r => 
      r.id === id ? { ...r, done: !r.done } : r
    );
    onUpdate(updated);
  };

  const deleteRequirement = (id: string) => {
    const updated = requirements.filter(r => r.id !== id);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Requirements</h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary">
          {requirements.filter(r => r.done).length} / {requirements.length}
        </span>
      </div>

      <div className="space-y-2">
        {requirements.map((req) => (
          <div key={req.id} className="group flex items-center gap-2 rounded-md border p-2 hover:bg-accent/50">
            <button 
              onClick={() => toggleRequirement(req.id)}
              className={cn(
                "shrink-0 transition-colors",
                req.done ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {req.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </button>
            <span className={cn("flex-1 text-sm", req.done && "line-through text-muted-foreground")}>
              {req.text}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              onClick={() => deleteRequirement(req.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={addRequirement} className="flex gap-2">
        <Input
          placeholder="Add a requirement..."
          value={newReq}
          onChange={(e) => setNewReq(e.target.value)}
          className="h-9"
        />
        <Button type="submit" size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>
    </div>
  );
};
