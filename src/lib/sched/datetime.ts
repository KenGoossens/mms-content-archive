// Parse Sched's human date strings into naive local datetimes.
//
// Sched renders e.g. "Tuesday October 27, 2026  7:00am -  7:45am PDT". There is
// no machine-readable datetime attribute and the timezone is an abbreviation
// (PDT) with no numeric offset, so we extract a naive local datetime plus the
// abbreviation rather than pretend we know the exact UTC instant.

export interface ParsedDate {
  /** "YYYY-MM-DDTHH:mm:ss" local, or null if unparseable. */
  start: string | null;
  end: string | null;
  /** Timezone abbreviation, e.g. "PDT", or null. */
  timezone: string | null;
  /** Human label as shown, e.g. "Tuesday October 27, 2026", or the raw string. */
  dateLabel: string | null;
}

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Parse "7:00am" / "12:30pm" into "HH:mm:ss" (24h), or null. */
function parseTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*([ap])m$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const meridiem = m[3].toLowerCase();
  if (hour === 12) hour = 0;
  if (meridiem === "p") hour += 12;
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}:00`;
}

/**
 * Parse a Sched date/time string. Resilient: on anything it doesn't recognise it
 * returns nulls for the datetimes but preserves the raw text as `dateLabel`.
 */
export function parseSchedDate(raw: string): ParsedDate {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { start: null, end: null, timezone: null, dateLabel: null };

  // <DayName> <Month> <Day>, <Year> <start> - <end> <TZ>
  const m = text.match(
    /^(\w+)\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+(.+?)\s*-\s*(.+?)(?:\s+([A-Z]{2,5}))?$/,
  );
  if (!m) {
    return { start: null, end: null, timezone: null, dateLabel: text };
  }

  const [, dayName, monthName, day, year, startRaw, endRaw, tz] = m;
  const month = MONTHS[monthName.toLowerCase()];
  const dateLabel = `${dayName} ${monthName} ${day}, ${year}`;
  if (!month) {
    return { start: null, end: null, timezone: tz ?? null, dateLabel };
  }

  const datePart = `${year}-${pad(month)}-${pad(parseInt(day, 10))}`;
  const startTime = parseTime(startRaw);
  const endTime = parseTime(endRaw);

  return {
    start: startTime ? `${datePart}T${startTime}` : null,
    end: endTime ? `${datePart}T${endTime}` : null,
    timezone: tz ?? null,
    dateLabel,
  };
}
