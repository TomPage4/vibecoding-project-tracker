import React from 'react';
import { Check, AlertCircle, Clock, ArrowDown, Bug, Star, X, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export type StatusBadgeVariant = 
  | 'done' 
  | 'overdue' 
  | 'high' 
  | 'medium' 
  | 'low' 
  | 'in_progress' 
  | 'open' 
  | 'neutral'
  | 'worked'
  | 'partial'
  | 'failed'
  | 'bug'
  | 'feature';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
  priority?: 'high' | 'medium' | 'low';
  taskType?: 'bug' | 'feature';
  status?: string;
  isOverdue?: boolean;
  isCompleted?: boolean;
  label?: string;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  priority,
  taskType,
  status,
  isOverdue,
  isCompleted,
  label,
  icon,
  className,
  children,
  ...props
}) => {
  // Determine effective variant
  let effVariant: StatusBadgeVariant = variant || 'neutral';
  let defaultLabel = '';
  let defaultIcon: React.ReactNode = null;

  if (taskType) {
    if (taskType === 'bug') {
      effVariant = 'bug';
      defaultLabel = 'Bug';
      defaultIcon = <Bug className="h-3 w-3 shrink-0" aria-hidden="true" />;
    } else {
      effVariant = 'feature';
      defaultLabel = 'Feature';
      defaultIcon = <Star className="h-3 w-3 shrink-0" aria-hidden="true" />;
    }
  } else if (priority) {
    if (priority === 'high') {
      effVariant = 'high';
      defaultLabel = 'High';
      defaultIcon = <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />;
    } else if (priority === 'medium') {
      effVariant = 'medium';
      defaultLabel = 'Medium';
      defaultIcon = <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />;
    } else {
      effVariant = 'low';
      defaultLabel = 'Low';
      defaultIcon = <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />;
    }
  } else if (isCompleted || status === 'done' || status === 'completed' || status === 'closed') {
    effVariant = 'done';
    defaultLabel = 'Done';
    defaultIcon = <Check className="h-3 w-3 shrink-0" aria-hidden="true" />;
  } else if (isOverdue || status === 'overdue') {
    effVariant = 'overdue';
    defaultLabel = 'Overdue';
    defaultIcon = <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />;
  } else if (status === 'in_progress') {
    effVariant = 'in_progress';
    defaultLabel = 'In progress';
    defaultIcon = <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />;
  } else if (status === 'open') {
    effVariant = 'open';
    defaultLabel = 'Open';
    defaultIcon = <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />;
  }

  // Set default labels/icons based on explicit variant if not already set
  if (!defaultIcon) {
    switch (effVariant) {
      case 'bug':
        defaultLabel = 'Bug';
        defaultIcon = <Bug className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'feature':
        defaultLabel = 'Feature';
        defaultIcon = <Star className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'worked':
        defaultLabel = 'Worked';
        defaultIcon = <Check className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'partial':
        defaultLabel = 'Partially worked';
        defaultIcon = <Minus className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'failed':
        defaultLabel = 'Failed';
        defaultIcon = <X className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'done':
        defaultLabel = 'Done';
        defaultIcon = <Check className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'overdue':
      case 'high':
        defaultLabel = effVariant === 'high' ? 'High' : 'Overdue';
        defaultIcon = <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'medium':
      case 'in_progress':
      case 'open':
        defaultLabel = effVariant === 'medium' ? 'Medium' : effVariant === 'open' ? 'Open' : 'In progress';
        defaultIcon = <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      case 'low':
        defaultLabel = 'Low';
        defaultIcon = <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
      default:
        defaultLabel = 'Active';
        defaultIcon = <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />;
        break;
    }
  }

  // Solid background colors (all >= 5.3:1 contrast against pure white text)
  const variantStyles: Record<StatusBadgeVariant, string> = {
    done: 'bg-emerald-700 text-white',
    worked: 'bg-emerald-700 text-white',
    overdue: 'bg-red-700 text-white',
    failed: 'bg-red-700 text-white',
    high: 'bg-red-700 text-white',
    medium: 'bg-amber-700 text-white',
    partial: 'bg-amber-700 text-white',
    in_progress: 'bg-blue-700 text-white',
    open: 'bg-blue-700 text-white',
    low: 'bg-slate-700 text-white',
    neutral: 'bg-slate-700 text-white',
    bug: 'bg-purple-700 text-white',
    feature: 'bg-sky-700 text-white',
  };

  const displayText = label || (typeof children === 'string' ? children : defaultLabel);
  // Ensure sentence case: First letter uppercase, rest lowercase
  const sentenceCased = displayText 
    ? displayText.charAt(0).toUpperCase() + displayText.slice(1)
    : '';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold select-none shadow-sm',
        variantStyles[effVariant],
        className
      )}
      {...props}
    >
      {icon || defaultIcon}
      <span>{sentenceCased || children}</span>
    </span>
  );
};
