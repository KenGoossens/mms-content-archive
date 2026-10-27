import type { Session } from "./types";

/** "7:00 AM" from a naive "YYYY-MM-DDTHH:mm:ss" datetime, or "" if null. */
function clockTime(iso: string | null): string {
  if (!iso) return "";
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "";
  let hour = parseInt(m[1], 10);
  const minute = m[2];
  const meridiem = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${meridiem}`;
}

/** A human time range line, e.g. "Tuesday October 27, 2026 · 7:00 AM – 7:45 AM PDT". */
export function formatSessionTime(session: Session): string {
  const parts: string[] = [];
  if (session.dateLabel) parts.push(session.dateLabel);
  const start = clockTime(session.start);
  const end = clockTime(session.end);
  if (start && end)
    parts.push(
      `${start} – ${end}${session.timezone ? " " + session.timezone : ""}`,
    );
  else if (start)
    parts.push(`${start}${session.timezone ? " " + session.timezone : ""}`);
  return parts.join(" · ");
}
