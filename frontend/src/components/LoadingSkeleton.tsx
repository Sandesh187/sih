'use client';

import { cn } from '@/lib/utils';

export function SkeletonText({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 bg-white/5 rounded animate-pulse relative overflow-hidden", className)}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

export function SkeletonCircle({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-full bg-white/5 animate-pulse relative overflow-hidden", className)}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-6 rounded-xl relative overflow-hidden", className)}>
      <div className="absolute inset-0 animate-shimmer bg-white/[0.02]" />
      <div className="flex items-center gap-4 mb-4">
        <SkeletonCircle className="w-12 h-12" />
        <div className="space-y-2 flex-1">
          <SkeletonText className="w-1/3" />
          <SkeletonText className="w-1/2" />
        </div>
      </div>
      <SkeletonText className="w-full h-24 mt-4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 animate-shimmer bg-white/[0.01] pointer-events-none" />
      <div className="border-b border-white/10 p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonText key={i} className="flex-1" />
          ))}
        </div>
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 border-b border-white/5 flex gap-4 items-center">
            <SkeletonText className="w-24" />
            <SkeletonText className="flex-1" />
            <SkeletonCircle className="w-6 h-6" />
            <SkeletonText className="w-32" />
            <SkeletonText className="w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <SkeletonText className="w-48 h-8" />
        <SkeletonText className="w-32 h-6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-32" />)}
      </div>
      <SkeletonTable rows={8} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}

export function TraceSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonText className="w-64 h-8 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard className="h-96" />
          <SkeletonTable rows={5} />
        </div>
        <div className="space-y-6">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    </div>
  );
}
