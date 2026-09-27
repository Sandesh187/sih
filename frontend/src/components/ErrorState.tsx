'use client';

import { AlertTriangle, ShieldOff, WifiOff, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'invalid-address' | 'network' | 'not-found' | 'generic';
}

export function ErrorState({ 
  title = "An error occurred", 
  message = "Something went wrong. Please try again.", 
  onRetry, 
  type = 'generic' 
}: ErrorStateProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'invalid-address': return <ShieldOff className="w-12 h-12 text-[#ff4444]" />;
      case 'network': return <WifiOff className="w-12 h-12 text-[#ffaa00]" />;
      case 'not-found': return <SearchX className="w-12 h-12 text-[#00d4ff]" />;
      case 'generic':
      default: return <AlertTriangle className="w-12 h-12 text-[#ff4444]" />;
    }
  };

  return (
    <div className={cn(
      "glass-card p-8 rounded-xl flex flex-col items-center justify-center text-center",
      type === 'invalid-address' || type === 'generic' ? "border-[#ff4444]/20" : ""
    )}>
      <div className="mb-4 p-4 rounded-full bg-black/20">
        {getIcon()}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md">{message}</p>
      
      <div className="flex items-center gap-4">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-6 py-2 bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 rounded-lg transition-colors font-medium border border-[#00d4ff]/30"
          >
            Try Again
          </button>
        )}
        <button className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4">
          Report Issue
        </button>
      </div>
    </div>
  );
}
