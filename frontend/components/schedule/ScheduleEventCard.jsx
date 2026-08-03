import clsx from "clsx";

export const scheduleStatusStyles = {
  done: {
    badge: "bg-[#f3eee6] text-[#9a8f7f]",
    dot: "bg-[#c4b8a8]",
  },
  live: {
    badge: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  upcoming: {
    badge: "bg-orange-50 text-orange-600",
    dot: "bg-orange-400",
  },
};

export const scheduleStatusLabels = {
  done: "Done",
  live: "Live now",
  upcoming: "Upcoming",
};

export function ScheduleStatusBadge({ status }) {
  return (
    <span
      className={clsx(
        "inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap",
        scheduleStatusStyles[status].badge
      )}
    >
      {scheduleStatusLabels[status]}
    </span>
  );
}

export default function ScheduleEventCard({ time, title, location, status }) {
  const isLive = status === "live";

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl px-5 py-4 border flex items-start gap-4",
        isLive
          ? "border-[#e69e46]/40 shadow-[0_4px_24px_rgba(230,158,70,0.18)]"
          : "border-border card-shadow"
      )}
    >
      <div className="w-14 shrink-0 pt-0.5">
        <p className="font-semibold text-navy text-sm tabular-nums">{time}</p>
        <div
          className={clsx(
            "w-2.5 h-2.5 rounded-full mt-2",
            scheduleStatusStyles[status].dot
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-navy text-base leading-snug">
              {title}
            </h3>
            <p className="text-muted text-sm mt-1">{location}</p>
          </div>
          <ScheduleStatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
