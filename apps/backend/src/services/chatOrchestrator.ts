import { db } from "../db/client";
import { autofillWeekSlots } from "./autofill";
import {
  removeAssignmentByEmployeeAndTime,
  removeAndRefillByEmployeeAndTime,
  replaceAssignmentByEmployeeAndTime,
  refillOpenSlot,
} from "./swap";
import {
  interpretMessage,
  type ChatTurn,
  type GeminiInterpretation,
  type ChatIntent,
} from "./gemini";

export interface ChatContext {
  lastDay?: string;
  lastShift?: "morning" | "evening";
  lastEmployee?: string;
  pendingClarification?: string;
  recentHistory: ChatTurn[];
}

export function createChatContext(): ChatContext {
  return { recentHistory: [] };
}

// --- Date helpers ---

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_NAMES_BY_INDEX = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDayDate(weekStart: string, dayOfWeek: string): string {
  const idx = DAY_ORDER.indexOf(dayOfWeek.toLowerCase());
  if (idx === -1) return weekStart;
  const start = new Date(`${weekStart}T00:00:00Z`);
  return toDateOnly(addDays(start, idx));
}

function getDayNameFromDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return DAY_NAMES_BY_INDEX[d.getUTCDay()];
}

function cap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Query helpers ---

function queryWeekScheduleSummary(weekStart: string): string {
  const endDate = toDateOnly(addDays(new Date(`${weekStart}T00:00:00Z`), 6));

  const rows = db
    .prepare(
      `
      SELECT date, shift, status, COUNT(*) as count
      FROM shift_slots
      WHERE date BETWEEN ? AND ?
      GROUP BY date, shift, status
      ORDER BY date, shift
      `
    )
    .all(weekStart, endDate) as Array<{
    date: string;
    shift: string;
    status: string;
    count: number;
  }>;

  if (rows.length === 0) {
    return `No schedule found for week of ${weekStart}. Try "Fill this week" to generate assignments.`;
  }

  const summary: Record<
    string,
    Record<string, { assigned: number; open: number }>
  > = {};
  for (const row of rows) {
    const d = getDayNameFromDate(row.date);
    if (!summary[d]) summary[d] = {};
    if (!summary[d][row.shift]) summary[d][row.shift] = { assigned: 0, open: 0 };
    if (row.status === "assigned") summary[d][row.shift].assigned += row.count;
    else summary[d][row.shift].open += row.count;
  }

  const lines: string[] = [`Schedule for week of ${weekStart}:\n`];
  let totalAssigned = 0;
  let totalSlots = 0;

  for (const day of DAY_ORDER) {
    if (!summary[day]) continue;
    for (const shift of ["morning", "evening"]) {
      const s = summary[day]?.[shift];
      if (!s) continue;
      const total = s.assigned + s.open;
      totalAssigned += s.assigned;
      totalSlots += total;
      const status = s.open === 0 ? "[full]" : `[${s.open} open]`;
      lines.push(`  ${cap(day)} ${shift}: ${s.assigned}/${total} filled ${status}`);
    }
  }

  lines.push(`\nTotal: ${totalAssigned}/${totalSlots} slots filled.`);
  return lines.join("\n");
}

function queryDaySchedule(weekStart: string, day: string): string {
  const date = getDayDate(weekStart, day);

  const rows = db
    .prepare(
      `
      SELECT ss.shift, ss.role, ss.required_skill, ss.status, e.name as employee_name
      FROM shift_slots ss
      LEFT JOIN employees e ON e.id = ss.employee_id
      WHERE ss.date = ?
      ORDER BY ss.shift, ss.role, ss.id
      `
    )
    .all(date) as Array<{
    shift: string;
    role: string;
    required_skill: string | null;
    status: string;
    employee_name: string | null;
  }>;

  if (rows.length === 0) {
    return `No schedule found for ${cap(day)} (${date}).`;
  }

  const byShift: Record<string, typeof rows> = {};
  for (const row of rows) {
    if (!byShift[row.shift]) byShift[row.shift] = [];
    byShift[row.shift].push(row);
  }

  const lines: string[] = [`${cap(day)} schedule (${date}):\n`];
  for (const shift of ["morning", "evening"]) {
    const slots = byShift[shift];
    if (!slots) continue;
    const open = slots.filter((s) => s.status === "open").length;
    lines.push(`  ${cap(shift)} shift (${open > 0 ? `${open} open` : "fully staffed"}):`);
    for (const slot of slots) {
      const skill = slot.required_skill ? ` [${slot.required_skill}]` : "";
      const who = slot.employee_name ?? "(open)";
      lines.push(`    ${slot.role}${skill}: ${who}`);
    }
  }

  return lines.join("\n");
}

function queryShiftSchedule(weekStart: string, day: string, shift: string): string {
  const date = getDayDate(weekStart, day);

  const rows = db
    .prepare(
      `
      SELECT ss.role, ss.required_skill, ss.status, e.name as employee_name
      FROM shift_slots ss
      LEFT JOIN employees e ON e.id = ss.employee_id
      WHERE ss.date = ? AND ss.shift = ?
      ORDER BY ss.role, ss.id
      `
    )
    .all(date, shift) as Array<{
    role: string;
    required_skill: string | null;
    status: string;
    employee_name: string | null;
  }>;

  if (rows.length === 0) {
    return `No schedule found for ${cap(day)} ${shift} (${date}).`;
  }

  const open = rows.filter((r) => r.status === "open").length;
  const lines: string[] = [
    `${cap(day)} ${shift} shift (${date}) — ${open > 0 ? `${open} open slot(s)` : "fully staffed"}:\n`,
  ];
  for (const slot of rows) {
    const skill = slot.required_skill ? ` [${slot.required_skill}]` : "";
    const who = slot.employee_name ?? "(open)";
    lines.push(`  ${slot.role}${skill}: ${who}`);
  }

  return lines.join("\n");
}

function queryEmployeeList(): string {
  const rows = db
    .prepare(`SELECT name, role FROM employees ORDER BY role, name`)
    .all() as Array<{ name: string; role: string }>;

  if (rows.length === 0) return "No employees found.";

  const byRole: Record<string, string[]> = {};
  for (const emp of rows) {
    if (!byRole[emp.role]) byRole[emp.role] = [];
    byRole[emp.role].push(emp.name);
  }

  const lines: string[] = [`Team members (${rows.length} total):\n`];
  for (const role of ["manager", "cook", "waiter", "hostess", "dishwasher"]) {
    const names = byRole[role];
    if (!names) continue;
    lines.push(`  ${cap(role)}s (${names.length}): ${names.join(", ")}`);
  }
  return lines.join("\n");
}

function queryEmployeeSchedule(employeeName: string, weekStart: string): string {
  const endDate = toDateOnly(addDays(new Date(`${weekStart}T00:00:00Z`), 6));

  const rows = db
    .prepare(
      `
      SELECT ss.date, ss.shift, ss.role
      FROM shift_slots ss
      JOIN employees e ON e.id = ss.employee_id
      WHERE LOWER(e.name) = LOWER(?) AND ss.date BETWEEN ? AND ? AND ss.status = 'assigned'
      ORDER BY ss.date, ss.shift
      `
    )
    .all(employeeName, weekStart, endDate) as Array<{
    date: string;
    shift: string;
    role: string;
  }>;

  if (rows.length === 0) {
    return `${employeeName} has no assignments this week (${weekStart} – ${endDate}).`;
  }

  const lines: string[] = [`${employeeName}'s schedule this week:\n`];
  for (const row of rows) {
    const dayName = getDayNameFromDate(row.date);
    lines.push(`  ${cap(dayName)} ${row.shift}: ${row.role}`);
  }
  return lines.join("\n");
}

function queryEmployeeAvailability(employeeName: string): string {
  const rows = db
    .prepare(
      `
      SELECT ea.day_of_week, ea.shift, ea.is_available
      FROM employee_availability ea
      JOIN employees e ON e.id = ea.employee_id
      WHERE LOWER(e.name) = LOWER(?)
      ORDER BY
        CASE ea.day_of_week
          WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6 WHEN 'sunday' THEN 7
        END,
        ea.shift
      `
    )
    .all(employeeName) as Array<{
    day_of_week: string;
    shift: string;
    is_available: number;
  }>;

  if (rows.length === 0) {
    return `No availability data found for "${employeeName}". Make sure the name is correct.`;
  }

  const available = rows
    .filter((r) => r.is_available)
    .map((r) => `${cap(r.day_of_week)} ${r.shift}`);
  const unavailable = rows
    .filter((r) => !r.is_available)
    .map((r) => `${cap(r.day_of_week)} ${r.shift}`);

  const lines: string[] = [`${employeeName}'s availability:\n`];
  if (available.length > 0) lines.push(`  Available: ${available.join(", ")}`);
  if (unavailable.length > 0) lines.push(`  Not available: ${unavailable.join(", ")}`);
  return lines.join("\n");
}

function queryScheduleRules(): string {
  const rows = db
    .prepare(
      `
      SELECT day_of_week, shift, role, required_skill, quantity
      FROM schedule_rules
      ORDER BY
        CASE day_of_week
          WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6 WHEN 'sunday' THEN 7
        END,
        CASE shift WHEN 'morning' THEN 1 WHEN 'evening' THEN 2 END,
        role
      `
    )
    .all() as Array<{
    day_of_week: string;
    shift: string;
    role: string;
    required_skill: string | null;
    quantity: number;
  }>;

  if (rows.length === 0) return "No staffing rules found.";

  const lines: string[] = ["Staffing rules:\n"];
  let lastKey = "";
  let items: string[] = [];

  const flush = (key: string) => {
    if (items.length === 0) return;
    const [d, s] = key.split("_");
    lines.push(`  ${cap(d)} ${s}: ${items.join(", ")}`);
    items = [];
  };

  for (const row of rows) {
    const key = `${row.day_of_week}_${row.shift}`;
    if (key !== lastKey) {
      flush(lastKey);
      lastKey = key;
    }
    const skill = row.required_skill ? ` (${row.required_skill})` : "";
    items.push(`${row.quantity}x ${row.role}${skill}`);
  }
  flush(lastKey);

  return lines.join("\n");
}

function queryExplainAssignment(
  weekStart: string,
  day?: string | null,
  shift?: string | null,
  employeeName?: string | null
): string {
  if (employeeName) {
    const emp = db
      .prepare(
        `
        SELECT e.name, e.role, GROUP_CONCAT(es.skill, ', ') as skills
        FROM employees e
        LEFT JOIN employee_skills es ON es.employee_id = e.id
        WHERE LOWER(e.name) = LOWER(?)
        GROUP BY e.id
        `
      )
      .get(employeeName) as
      | { name: string; role: string; skills: string | null }
      | undefined;

    if (!emp) return `Employee "${employeeName}" not found.`;
    const skillText = emp.skills ? `Their skills include: ${emp.skills}.` : "No special skills listed.";
    return `${emp.name} is a ${emp.role}. ${skillText} Assignments are made based on role match, shift availability, and workload balance (fewest shifts assigned first).`;
  }

  if (day && shift) {
    const date = getDayDate(weekStart, day);
    const rows = db
      .prepare(
        `
        SELECT ss.role, ss.required_skill, e.name as employee_name
        FROM shift_slots ss
        LEFT JOIN employees e ON e.id = ss.employee_id
        WHERE ss.date = ? AND ss.shift = ? AND ss.status = 'assigned'
        ORDER BY ss.role, ss.id
        `
      )
      .all(date, shift) as Array<{
      role: string;
      required_skill: string | null;
      employee_name: string | null;
    }>;

    if (rows.length === 0) {
      return `No assigned employees for ${cap(day)} ${shift}.`;
    }

    const lines: string[] = [
      `Assignments for ${cap(day)} ${shift} — selected by role match, availability, and workload balance:\n`,
    ];
    for (const row of rows) {
      const skill = row.required_skill ? ` [requires ${row.required_skill}]` : "";
      lines.push(`  ${row.role}${skill}: ${row.employee_name}`);
    }
    return lines.join("\n");
  }

  return "Please specify an employee name, or both a day and a shift to explain.";
}

function queryExplainUnavailability(
  weekStart: string,
  day: string,
  shift: string
): string {
  const date = getDayDate(weekStart, day);

  const openSlots = db
    .prepare(
      `
      SELECT role, required_skill
      FROM shift_slots
      WHERE date = ? AND shift = ? AND status = 'open'
      `
    )
    .all(date, shift) as Array<{ role: string; required_skill: string | null }>;

  if (openSlots.length === 0) {
    return `All slots for ${cap(day)} ${shift} are filled.`;
  }

  const lines: string[] = [`Open slots for ${cap(day)} ${shift} (${date}):\n`];

  for (const slot of openSlots) {
    const skillNote = slot.required_skill ? ` with skill "${slot.required_skill}"` : "";

    const candidates = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM employees e
        JOIN employee_availability ea ON ea.employee_id = e.id
        WHERE e.role = ?
          AND ea.day_of_week = ?
          AND ea.shift = ?
          AND ea.is_available = 1
          AND (? IS NULL OR EXISTS (
            SELECT 1 FROM employee_skills es
            WHERE es.employee_id = e.id AND es.skill = ?
          ))
        `
      )
      .get(
        slot.role,
        day.toLowerCase(),
        shift,
        slot.required_skill,
        slot.required_skill
      ) as { count: number };

    const reason =
      candidates.count === 0
        ? "no employees match the role/skill/availability requirements"
        : "all matching employees are already assigned this shift";

    lines.push(`  ${slot.role}${skillNote}: ${reason}`);
  }

  return lines.join("\n");
}

// --- Fill helpers ---

function fillDay(weekStart: string, day: string): string {
  const date = getDayDate(weekStart, day);

  const openSlots = db
    .prepare(`SELECT id FROM shift_slots WHERE date = ? AND status = 'open'`)
    .all(date) as Array<{ id: number }>;

  if (openSlots.length === 0) {
    return `All slots for ${cap(day)} are already filled.`;
  }

  let filled = 0;
  for (const slot of openSlots) {
    const result = refillOpenSlot(slot.id);
    if (result.ok) filled++;
  }

  const remaining = openSlots.length - filled;
  if (filled === 0) {
    return `Could not fill any open slots for ${cap(day)}. No available employees match the requirements.`;
  }
  return remaining > 0
    ? `Filled ${filled} slot(s) for ${cap(day)}. ${remaining} slot(s) remain open (no available match).`
    : `Successfully filled all ${filled} open slot(s) for ${cap(day)}.`;
}

function fillShift(weekStart: string, day: string, shift: string): string {
  const date = getDayDate(weekStart, day);

  const openSlots = db
    .prepare(
      `SELECT id FROM shift_slots WHERE date = ? AND shift = ? AND status = 'open'`
    )
    .all(date, shift) as Array<{ id: number }>;

  if (openSlots.length === 0) {
    return `All slots for ${cap(day)} ${shift} are already filled.`;
  }

  let filled = 0;
  for (const slot of openSlots) {
    const result = refillOpenSlot(slot.id);
    if (result.ok) filled++;
  }

  const remaining = openSlots.length - filled;
  if (filled === 0) {
    return `Could not fill any open slots for ${cap(day)} ${shift}. No available employees match.`;
  }
  return remaining > 0
    ? `Filled ${filled} slot(s) for ${cap(day)} ${shift}. ${remaining} slot(s) remain open.`
    : `Successfully filled all ${filled} open slot(s) for ${cap(day)} ${shift}.`;
}

// --- Context helpers ---

function buildContextNote(context: ChatContext): string {
  const parts: string[] = [];
  if (context.lastDay) parts.push(`last_day=${context.lastDay}`);
  if (context.lastShift) parts.push(`last_shift=${context.lastShift}`);
  if (context.lastEmployee) parts.push(`last_employee="${context.lastEmployee}"`);
  if (context.pendingClarification)
    parts.push(`pending_clarification="${context.pendingClarification}"`);
  return parts.length > 0 ? `[Context: ${parts.join(", ")}]` : "";
}

function updateContext(
  context: ChatContext,
  interpretation: GeminiInterpretation,
  userMessage: string,
  assistantMessage: string
): void {
  const { params } = interpretation;
  if (params.day) context.lastDay = params.day;
  if (params.shift) context.lastShift = params.shift as "morning" | "evening";
  if (params.employee_name) context.lastEmployee = params.employee_name;

  context.recentHistory = [
    ...context.recentHistory.slice(-3),
    { role: "user", parts: [{ text: userMessage }] },
    { role: "model", parts: [{ text: assistantMessage }] },
  ];

  if (!interpretation.requires_clarification) {
    context.pendingClarification = undefined;
  }
}

// --- Main orchestrator ---

export async function orchestrateChat(
  message: string,
  context: ChatContext
): Promise<{ message: string; mutated: boolean }> {
  const contextNote = buildContextNote(context);

  let interpretation: GeminiInterpretation;
  try {
    interpretation = await interpretMessage(message, context.recentHistory, contextNote);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[chat] Gemini error:", errMsg);
    const fallback = errMsg.includes("GEMINI_API_KEY")
      ? "Gemini API key not configured. Add GEMINI_API_KEY to your .env file and restart the server."
      : `Gemini error: ${errMsg}`;
    return { message: fallback, mutated: false };
  }

  const weekStart = getCurrentWeekStart();
  let responseMessage: string;
  let mutated = false;

  if (interpretation.status === "incomplete" || interpretation.status === "ambiguous") {
    const question =
      interpretation.clarification_question ?? "Could you provide more details?";
    context.pendingClarification = question;
    updateContext(context, interpretation, message, question);
    return { message: question, mutated: false };
  }

  if (interpretation.status === "unsupported") {
    responseMessage =
      "I understand you're asking about scheduling, but that specific operation isn't supported yet. Type \"help\" to see what I can do.";
    updateContext(context, interpretation, message, responseMessage);
    return { message: responseMessage, mutated: false };
  }

  if (interpretation.status === "out_of_domain") {
    responseMessage =
      "I can only help with restaurant scheduling. Try asking about the schedule, employees, or staffing actions.";
    updateContext(context, interpretation, message, responseMessage);
    return { message: responseMessage, mutated: false };
  }

  const { intent, params } = interpretation;

  switch (intent as ChatIntent) {
    case "fill_week": {
      const result = autofillWeekSlots(weekStart);
      if (result.filled === 0 && result.remainingOpen === 0) {
        responseMessage = "The week is already fully staffed — nothing left to fill.";
      } else if (result.filled === 0) {
        responseMessage = `Could not fill any open slots. ${result.remainingOpen} slot(s) remain open due to unavailability.`;
      } else {
        responseMessage =
          result.remainingOpen > 0
            ? `Filled ${result.filled} slot(s) this week. ${result.remainingOpen} slot(s) remain open (no available match).`
            : `Successfully filled all ${result.filled} open slot(s). The week is fully staffed.`;
      }
      mutated = result.filled > 0;
      break;
    }

    case "fill_day": {
      responseMessage = fillDay(weekStart, params.day!);
      mutated = true;
      break;
    }

    case "fill_shift": {
      responseMessage = fillShift(weekStart, params.day!, params.shift!);
      mutated = true;
      break;
    }

    case "remove_assignment": {
      const result = removeAssignmentByEmployeeAndTime(
        params.employee_name!,
        params.day!,
        params.shift!
      );
      responseMessage = result.ok
        ? `Removed ${params.employee_name} from ${cap(params.day!)} ${params.shift!}. The slot is now open.`
        : result.message;
      mutated = result.ok;
      break;
    }

    case "remove_and_refill_assignment": {
      const result = removeAndRefillByEmployeeAndTime(
        params.employee_name!,
        params.day!,
        params.shift!
      );
      if (result.ok) {
        const refilled = (result as { employee?: { name: string } }).employee;
        responseMessage = refilled
          ? `Removed ${params.employee_name} from ${cap(params.day!)} ${params.shift!} and filled the slot with ${refilled.name}.`
          : `Removed ${params.employee_name} from ${cap(params.day!)} ${params.shift!}. No available replacement was found — slot is open.`;
      } else {
        responseMessage = result.message;
      }
      mutated = result.ok;
      break;
    }

    case "replace_assignment": {
      const result = replaceAssignmentByEmployeeAndTime(
        params.employee_name!,
        params.replacement_name!,
        params.day!,
        params.shift!
      );
      responseMessage = result.ok
        ? `Replaced ${params.employee_name} with ${params.replacement_name} on ${cap(params.day!)} ${params.shift!}.`
        : result.message;
      mutated = result.ok;
      break;
    }

    case "show_week_schedule": {
      responseMessage = queryWeekScheduleSummary(weekStart);
      break;
    }

    case "show_day_schedule": {
      responseMessage = queryDaySchedule(weekStart, params.day!);
      break;
    }

    case "show_shift_schedule": {
      responseMessage = queryShiftSchedule(weekStart, params.day!, params.shift!);
      break;
    }

    case "show_employees": {
      responseMessage = queryEmployeeList();
      break;
    }

    case "show_employee_schedule": {
      responseMessage = queryEmployeeSchedule(params.employee_name!, weekStart);
      break;
    }

    case "show_employee_availability": {
      responseMessage = queryEmployeeAvailability(params.employee_name!);
      break;
    }

    case "show_rules": {
      responseMessage = queryScheduleRules();
      break;
    }

    case "explain_assignment": {
      responseMessage = queryExplainAssignment(
        weekStart,
        params.day,
        params.shift,
        params.employee_name
      );
      break;
    }

    case "explain_unavailability": {
      responseMessage = queryExplainUnavailability(weekStart, params.day!, params.shift!);
      break;
    }

    case "help": {
      responseMessage =
        `Here's what I can help you with:\n\n` +
        `Schedule actions:\n` +
        `  "Fill this week" — auto-staff all open slots\n` +
        `  "Fill Monday" — fill open slots for a day\n` +
        `  "Fill Monday morning" — fill a specific shift\n` +
        `  "Remove Ana Lima from Monday morning"\n` +
        `  "Remove and refill Bruno Costa from Friday evening"\n` +
        `  "Replace Ana Lima with Bruno Costa on Monday morning"\n\n` +
        `Schedule queries:\n` +
        `  "Show me this week's schedule"\n` +
        `  "Who's working on Monday?"\n` +
        `  "Show Monday morning shift"\n` +
        `  "List all employees"\n` +
        `  "Show Ana Lima's schedule this week"\n` +
        `  "Is Carlos Lima available on Tuesday?"\n` +
        `  "What are the staffing rules?"\n` +
        `  "Why is Monday morning understaffed?"`;
      break;
    }

    default: {
      responseMessage =
        "I'm not sure how to handle that. Try \"help\" to see what I can do.";
      break;
    }
  }

  updateContext(context, interpretation, message, responseMessage);
  return { message: responseMessage, mutated };
}
