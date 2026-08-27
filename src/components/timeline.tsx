import { formatDate, formatTime } from "@/lib/dates";
import { roleLabel } from "@/lib/rbac";
import type { Role } from "@prisma/client";

type Event = {
  id: string;
  createdAt: Date | string;
  actorName: string;
  actorRole: Role;
  activity: string;
  department: string;
  summary: string;
};

export function ClinicalTimeline({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--line)] px-6 py-10 text-center text-sm text-[var(--muted)]">
        No clinical timeline events are available for this patient.
      </div>
    );
  }
  const groups = new Map<string, Event[]>();
  for (const event of events) {
    const key = formatDate(event.createdAt);
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([day, items]) => (
        <section key={day}>
          <h3 className="pm-label mb-3">{day}</h3>
          <ol className="relative space-y-4 border-l border-[var(--line)] pl-5">
            {items.map((item) => (
              <li key={item.id}>
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--teal)]" />
                <p className="text-xs tabular text-[var(--muted)]">{formatTime(item.createdAt)}</p>
                <p className="font-medium">{item.summary}</p>
                <p className="text-sm text-[var(--muted)]">
                  {item.actorName} · {roleLabel(item.actorRole)} · {item.department}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
