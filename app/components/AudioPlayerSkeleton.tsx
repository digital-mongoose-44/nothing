/**
 * AudioPlayerSkeleton.tsx - Loading Skeleton for Radio Traffic
 *
 * Restyled with shadcn/ui Skeleton primitive and Card container.
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AudioPlayerSkeleton() {
  return (
    <Card className="mt-3 border-border bg-card">
      <CardContent className="p-4">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Player controls skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        </div>

        {/* Metadata skeleton */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>

        {/* Transcription skeleton */}
        <div className="mt-4">
          <Skeleton className="mb-2 h-4 w-24" />
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Screen reader announcement */}
        <span className="sr-only">Loading radio traffic data...</span>
      </CardContent>
    </Card>
  );
}
