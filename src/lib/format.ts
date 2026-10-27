import type { Session } from "./types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "October 25–28, 2026" (or spanning months/years) from two ISO dates. */
export function formatDateRange(startISO: string, endISO: string): string {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  if (!sy || !sm || !sd) return startISO;
  const sMonth = MONTH_NAMES[sm - 1];
  if (!ey) return `${sMonth} ${sd}, ${sy}`;
  const eMonth = MONTH_NAMES[em - 1];
  if (sy === ey && sm === em) return `${sMonth} ${sd}–${ed}, ${sy}`;
  if (sy === ey) return `${sMonth} ${sd} – ${eMonth} ${ed}, ${sy}`;
  return `${sMonth} ${sd}, ${sy} – ${eMonth} ${ed}, ${ey}`;
}

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
