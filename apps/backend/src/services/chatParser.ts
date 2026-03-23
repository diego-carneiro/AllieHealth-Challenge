const validDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
] as const;

const validShifts = ["morning", "evening"] as const;

type DayOfWeek = (typeof validDays)[number];
type Shift = (typeof validShifts)[number];

export type ChatCommand =
  | { type: "fill_week"; weekStart: string }
  | { type: "show_schedule" }
  | { type: "show_day_schedule"; dayOfWeek: DayOfWeek }
  | { type: "show_employees" }
  | { type: "show_rules" }
  | { type: "remove_assignment"; employeeName: string; dayOfWeek: DayOfWeek; shift: Shift }
  | { type: "remove_and_refill_assignment"; employeeName: string; dayOfWeek: DayOfWeek; shift: Shift }
  | { type: "replace_assignment"; fromEmployeeName: string; toEmployeeName: string; dayOfWeek: DayOfWeek; shift: Shift }
  | { type: "unknown"; raw: string };

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay(); // sunday 0 ... saturday 6
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export function parseChatMessage(message: string): ChatCommand {
  const raw = message.trim();
  const input = raw.toLowerCase();

  const fillWeekMatch = input.match(
    /^fill this week(?:\s+starting\s+(\d{4}-\d{2}-\d{2}))?$/
  );
  if (fillWeekMatch) {
    return {
      type: "fill_week",
      weekStart: fillWeekMatch[1] ?? getCurrentMonday()
    };
  }

  if (input === "show schedule") {
    return { type: "show_schedule" };
  }

  const showDayMatch = input.match(
    /^show (monday|tuesday|wednesday|thursday|friday|saturday|sunday) schedule$/
  );
  if (showDayMatch) {
    return {
      type: "show_day_schedule",
      dayOfWeek: showDayMatch[1] as DayOfWeek
    };
  }

  if (input === "show employees") {
    return { type: "show_employees" };
  }

  if (input === "show rules") {
    return { type: "show_rules" };
  }

  const removeAndRefillMatch = raw.match(
    /^remove and refill (.+) from (monday|tuesday|wednesday|thursday|friday|saturday|sunday) (morning|evening)$/i
  );
  if (removeAndRefillMatch) {
    return {
      type: "remove_and_refill_assignment",
      employeeName: removeAndRefillMatch[1].trim(),
      dayOfWeek: removeAndRefillMatch[2].toLowerCase() as DayOfWeek,
      shift: removeAndRefillMatch[3].toLowerCase() as Shift
    };
  }

  const removeMatch = raw.match(
    /^remove (.+) from (monday|tuesday|wednesday|thursday|friday|saturday|sunday) (morning|evening)$/i
  );
  if (removeMatch) {
    return {
      type: "remove_assignment",
      employeeName: removeMatch[1].trim(),
      dayOfWeek: removeMatch[2].toLowerCase() as DayOfWeek,
      shift: removeMatch[3].toLowerCase() as Shift
    };
  }

  const replaceMatch = raw.match(
    /^replace (.+) with (.+) on (monday|tuesday|wednesday|thursday|friday|saturday|sunday) (morning|evening)$/i
  );
  if (replaceMatch) {
    return {
      type: "replace_assignment",
      fromEmployeeName: replaceMatch[1].trim(),
      toEmployeeName: replaceMatch[2].trim(),
      dayOfWeek: replaceMatch[3].toLowerCase() as DayOfWeek,
      shift: replaceMatch[4].toLowerCase() as Shift
    };
  }

  return {
    type: "unknown",
    raw: message
  };
}
