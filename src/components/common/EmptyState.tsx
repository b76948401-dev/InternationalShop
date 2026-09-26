import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-neutral-200/80 shadow-xs max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5 text-neutral-400">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 mb-2 font-['Outfit',sans-serif]">{title}</h3>
      <p className="text-neutral-500 text-sm mb-6 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
