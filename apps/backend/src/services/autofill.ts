import { db } from "../db/client";

type OpenSlot = {
  id: number;
  date: string;
  shift: string;
  role: string;
  required_skill: string | null;
};

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDayOfWeek(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return dayNames[date.getUTCDay()];
}

export function autofillWeekSlots(weekStart: string) {
  const startDate = new Date(`${weekStart}T00:00:00Z`);
  const endDate = addDays(startDate, 6);
  const endDateString = toDateOnly(endDate);

  const openSlots = db
    .prepare(
      `
      SELECT id, date, shift, role, required_skill
      FROM shift_slots
      WHERE date BETWEEN ? AND ?
        AND status = 'open'
      ORDER BY date, shift, role, id
      `
    )
    .all(weekStart, endDateString) as OpenSlot[];

  const findCandidate = db.prepare(`
    SELECT
      e.id,
      e.name,
      COUNT(ss2.id) as assigned_count
    FROM employees e
    LEFT JOIN employee_skills esk
      ON esk.employee_id = e.id
    LEFT JOIN employee_availability ea
      ON ea.employee_id = e.id
    LEFT JOIN shift_slots ss2
      ON ss2.employee_id = e.id
      AND ss2.date BETWEEN ? AND ?
      AND ss2.status = 'assigned'
    WHERE e.role = ?
      AND ea.day_of_week = ?
      AND ea.shift = ?
      AND ea.is_available = 1
      AND NOT EXISTS (
        SELECT 1
        FROM shift_slots existing_same_shift
        WHERE existing_same_shift.employee_id = e.id
          AND existing_same_shift.date = ?
          AND existing_same_shift.shift = ?
          AND existing_same_shift.status = 'assigned'
      )
      AND (
        ? IS NULL
        OR EXISTS (
          SELECT 1
          FROM employee_skills skill_check
          WHERE skill_check.employee_id = e.id
            AND skill_check.skill = ?
        )
      )
    GROUP BY e.id, e.name
    ORDER BY assigned_count ASC, e.name ASC
    LIMIT 1
  `);

  const updateSlot = db.prepare(`
    UPDATE shift_slots
    SET employee_id = ?, status = 'assigned'
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    let filled = 0;

    for (const slot of openSlots) {
      const dayOfWeek = getDayOfWeek(slot.date);

      const candidate = findCandidate.get(
        weekStart,
        endDateString,
        slot.role,
        dayOfWeek,
        slot.shift,
        slot.date,
        slot.shift,
        slot.required_skill,
        slot.required_skill
      ) as { id: number; name: string; assigned_count: number } | undefined;

      if (!candidate) {
        continue;
      }

      updateSlot.run(candidate.id, slot.id);
      filled += 1;
    }

    return filled;
  });

  const filled = transaction();

  const remaining = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shift_slots
      WHERE date BETWEEN ? AND ?
        AND status = 'open'
      `
    )
    .get(weekStart, endDateString) as { count: number };

  return {
    filled,
    remainingOpen: remaining.count,
    message: "Autofill completed."
  };
}
