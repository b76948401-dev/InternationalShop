import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while communicating with the server. Please check your connection and try again.',
  onRetry,
  onGoBack,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-rose-100 shadow-xs max-w-lg mx-auto my-12">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-5 text-rose-500">
        <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 mb-2 font-['Outfit',sans-serif]">{title}</h3>
      <p className="text-neutral-500 text-sm mb-6 max-w-sm leading-relaxed">{message}</p>
      <div className="flex items-center gap-3">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
