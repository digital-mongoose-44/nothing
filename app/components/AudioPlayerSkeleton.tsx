"use client";

/**
 * Loading skeleton that matches the AudioPlayer layout.
 * Displays while radio traffic data is being fetched.
 * Responsive design mirrors AudioPlayer component.
 */
export function AudioPlayerSkeleton() {
  return (
    <div
      className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-700 dark:bg-zinc-900 animate-pulse"
      role="status"
      aria-label="Loading radio traffic"
    >
      {/* Header skeleton */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <div className="h-4 w-32 sm:w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Play button and seek bar skeleton */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-2 flex justify-between">
            <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>

      {/* Metadata skeleton */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:flex-wrap sm:gap-x-4">
        <div className="h-3 sm:h-4 w-16 sm:w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 sm:h-4 w-20 sm:w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 sm:h-4 w-20 sm:w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Transcription skeleton */}
      <div className="mt-3 sm:mt-4">
        <div className="mb-2 h-3 sm:h-4 w-20 sm:w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-100/50 p-2 sm:p-3 dark:border-zinc-700 dark:bg-zinc-800/50 max-h-48 sm:max-h-64 overflow-hidden">
          {/* Segment skeletons */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-md border border-zinc-200 bg-white p-1.5 sm:p-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="mb-1 flex flex-wrap items-center gap-1 sm:gap-2">
                <div className="h-4 w-14 sm:w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-16 sm:w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-3 sm:h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading radio traffic data...</span>
    </div>
  );
}
