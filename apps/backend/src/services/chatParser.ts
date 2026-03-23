export type ChatCommand =
  | { type: "fill_week"; weekStart: string }
  | { type: "show_schedule" }
  | { type: "show_employees" }
  | { type: "show_rules" }
  | { type: "remove_slot"; slotId: number }
  | { type: "refill_slot"; slotId: number }
  | { type: "remove_and_refill_slot"; slotId: number }
  | { type: "unknown"; raw: string };

export function parseChatMessage(message: string): ChatCommand {
  const input = message.trim().toLowerCase();

  const fillWeekMatch = input.match(/^fill this week(?:\s+starting\s+(\d{4}-\d{2}-\d{2}))?$/);
  if (fillWeekMatch) {
    return {
      type: "fill_week",
      weekStart: fillWeekMatch[1] ?? "2026-03-23"
    };
  }

  if (input === "show schedule") {
    return { type: "show_schedule" };
  }

  if (input === "show employees") {
    return { type: "show_employees" };
  }

  if (input === "show rules") {
    return { type: "show_rules" };
  }

  const removeAndRefillMatch = input.match(/^remove and refill slot (\d+)$/);
  if (removeAndRefillMatch) {
    return {
      type: "remove_and_refill_slot",
      slotId: Number(removeAndRefillMatch[1])
    };
  }

  const removeMatch = input.match(/^remove slot (\d+)$/);
  if (removeMatch) {
    return {
      type: "remove_slot",
      slotId: Number(removeMatch[1])
    };
  }

  const refillMatch = input.match(/^refill slot (\d+)$/);
  if (refillMatch) {
    return {
      type: "refill_slot",
      slotId: Number(refillMatch[1])
    };
  }

  return {
    type: "unknown",
    raw: message
  };
}
