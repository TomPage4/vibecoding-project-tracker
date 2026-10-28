import React, { useState, useRef, useEffect } from 'react';
import { Tag, Check, X, ChevronDown } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from '../../lib/utils';

interface LabelMultiSelectProps {
  availableLabels: string[];
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  compact?: boolean;
  placeholder?: string;
}

export const LabelMultiSelect: React.FC<LabelMultiSelectProps> = ({
  availableLabels,
  selectedLabels,
  onChange,
  disabled = false,
  label = 'Labels',
  id = 'label-multiselect',
  compact = false,
  placeholder = 'Select labels...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleLabel = (labelToToggle: string) => {
    if (disabled) return;
    if (selectedLabels.includes(labelToToggle)) {
      onChange(selectedLabels.filter(l => l !== labelToToggle));
    } else {
      onChange([...selectedLabels, labelToToggle]);
    }
  };

  const removeLabel = (labelToRemove: string) => {
    if (disabled) return;
    onChange(selectedLabels.filter(l => l !== labelToRemove));
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && !compact && (
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Selected labels display */}
        {selectedLabels.map((lbl) => (
          <Badge
            key={lbl}
            variant="outline"
            className={cn(
              "inline-flex items-center gap-1 font-medium transition-colors",
              compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
            )}
          >
            <span>{lbl}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeLabel(lbl)}
                aria-label={`Remove label ${lbl}`}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </Badge>
        ))}

        {/* Dropdown trigger button */}
        {!disabled ? (
          <button
            ref={triggerRef}
            id={id}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={`${label}: ${selectedLabels.length} selected`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-input bg-background font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              compact 
                ? "h-6 px-2 text-[11px]" 
                : "h-9 px-3 text-xs"
            )}
          >
            <Tag className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden="true" />
            <span>
              {selectedLabels.length === 0 
                ? placeholder 
                : compact 
                  ? '+ Add' 
                  : `Add / Edit (${selectedLabels.length})`}
            </span>
            <ChevronDown className={cn("shrink-0 opacity-60", compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5")} aria-hidden="true" />
          </button>
        ) : (
          selectedLabels.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No labels</span>
          )
        )}
      </div>

      {/* Popover Menu */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Available labels"
          className="absolute z-50 mt-1 max-h-56 w-56 overflow-y-auto rounded-md border bg-popover p-1.5 shadow-md focus:outline-none text-popover-foreground text-xs"
        >
          {availableLabels.length === 0 ? (
            <div className="p-2 text-center text-muted-foreground italic">
              No project labels defined.<br />Add labels in Project Settings.
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Project Labels
              </div>
              {availableLabels.map((item) => {
                const isSelected = selectedLabels.includes(item);
                return (
                  <button
                    key={item}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => toggleLabel(item)}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      isSelected && "font-semibold bg-accent/50"
                    )}
                  >
                    <span className="truncate">{item}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
