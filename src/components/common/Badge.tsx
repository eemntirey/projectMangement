import React from 'react';
import { TaskPriority, StatusType } from '../../types';
import { AlertCircle, Clock, CheckCircle2, MinusCircle, AlertTriangle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = {
    urgent: {
      label: 'Urgent',
      icon: AlertCircle,
      bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    },
    high: {
      label: 'Élevée',
      icon: AlertTriangle,
      bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    medium: {
      label: 'Moyenne',
      icon: Clock,
      bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    low: {
      label: 'Basse',
      icon: MinusCircle,
      bg: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    }
  }[priority] || {
    label: priority,
    icon: Clock,
    bg: 'bg-slate-100 text-slate-700'
  };

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-md border ${config.bg} ${padding}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

interface StatusBadgeProps {
  label: string;
  color: string;
  type?: StatusType;
  size?: 'sm' | 'md';
}

export function StatusBadge({ label, color, type, size = 'sm' }: StatusBadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 ${padding}`}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}40`,
        color: color
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </span>
  );
}
