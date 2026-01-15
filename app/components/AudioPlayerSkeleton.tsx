"use client";

/**
 * Loading skeleton that matches the AudioPlayer layout.
 * Displays while radio traffic data is being fetched.
 */
export function AudioPlayerSkeleton() {
  return (
    <div
      className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 animate-pulse"
      role="status"
      aria-label="Loading radio traffic"
    >
      {/* Header skeleton */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Play button and seek bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-2 flex justify-between">
            <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>

      {/* Metadata skeleton */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Transcription skeleton */}
      <div className="mt-4">
        <div className="mb-2 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-100/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          {/* Segment skeletons */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading radio traffic data...</span>
    </div>
  );
}
