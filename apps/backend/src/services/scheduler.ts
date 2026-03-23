import { db } from "../db/client";

type RuleRow = {
  id: number;
  day_of_week: string;
  shift: string;
  role: string;
  required_skill: string | null;
  quantity: number;
};

const dayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function generateWeekSlots(weekStart: string) {
  const startDate = new Date(`${weekStart}T00:00:00`);

  const endDate = addDays(startDate, 6);
  const endDateString = toDateOnly(endDate);

  const existingSlots = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM shift_slots
      WHERE date BETWEEN ? AND ?
      `
    )
    .get(weekStart, endDateString) as { count: number };

  if (existingSlots.count > 0) {
    return {
      created: 0,
      skipped: true,
      message: "Week slots already exist for this date range."
    };
  }

  const rules = db
    .prepare(
      `
      SELECT id, day_of_week, shift, role, required_skill, quantity
      FROM schedule_rules
      `
    )
    .all() as RuleRow[];

  const insertSlot = db.prepare(`
    INSERT INTO shift_slots (date, shift, role, required_skill, employee_id, status)
    VALUES (?, ?, ?, ?, NULL, 'open')
  `);

  const transaction = db.transaction(() => {
    let created = 0;

    for (const rule of rules) {
      const dayIndex = dayOrder.indexOf(rule.day_of_week);
      if (dayIndex === -1) continue;

      const slotDate = addDays(startDate, dayIndex);
      const slotDateString = toDateOnly(slotDate);

      for (let i = 0; i < rule.quantity; i++) {
        insertSlot.run(
          slotDateString,
          rule.shift,
          rule.role,
          rule.required_skill
        );
        created += 1;
      }
    }

    return created;
  });

  const created = transaction();

  return {
    created,
    skipped: false,
    message: "Week slots generated successfully."
  };
}
