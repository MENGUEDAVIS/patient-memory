"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">The workspace could not load this page.</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{error.message || "An unexpected error occurred. Please try again."}</p>
        <button onClick={reset} className="mt-4 rounded-md bg-[var(--navy)] px-3 py-2 text-sm text-white">
          Try again
        </button>
      </div>
    </div>
  );
}
