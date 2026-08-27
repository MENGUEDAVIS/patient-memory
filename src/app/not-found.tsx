import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="pm-label">Missing record</p>
        <h1 className="mt-2 text-2xl font-semibold">This record was not found.</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">The identifier does not match a record you are authorized to view.</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">Return to workspace</Link>
      </div>
    </div>
  );
}
