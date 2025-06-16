"use client";

import { Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AILoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8'
};

const AIThinkingDots = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
  </div>
);

export const AISpinner = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg', className?: string }) => (
  <div className={cn("relative", className)}>
    <Bot className={cn(sizeClasses[size], "text-blue-600 animate-pulse")} />
    <Sparkles className={cn(sizeClasses[size], "absolute -top-1 -right-1 text-purple-500 animate-spin")} />
  </div>
);

export const AILoading = ({ message = "IA procesando...", size = 'md', className }: AILoadingProps) => (
  <div className={cn("flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100", className)}>
    <AISpinner size={size} />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{message}</span>
        <AIThinkingDots />
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

export const AILoadingSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
    <div className="flex items-center gap-3 mb-4">
      <AISpinner size="sm" />
      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse"></div>
      </div>
    ))}
  </div>
);