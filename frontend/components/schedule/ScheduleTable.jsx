import { ScheduleStatusBadge } from "@/components/schedule/ScheduleEventCard";
import clsx from "clsx";

export default function ScheduleTable({ events }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 card-shadow border border-border text-center">
        <p className="text-muted text-sm">No events on the schedule.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl card-shadow border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-center">
          <thead>
            <tr className="border-b border-border bg-cream/60">
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Time
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Event
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Location
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const isLive = event.status === "live";
              return (
                <tr
                  key={event.id}
                  className={clsx(
                    "border-b border-border last:border-b-0 transition-colors",
                    isLive ? "bg-gold/40" : "hover:bg-cream/40"
                  )}
                >
                  <td className="px-6 py-4 font-semibold text-navy text-sm tabular-nums whitespace-nowrap">
                    {event.time}
                  </td>
                  <td className="px-6 py-4 font-semibold text-navy">
                    {event.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{event.location}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ScheduleStatusBadge status={event.status} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
