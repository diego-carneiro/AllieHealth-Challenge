import { db } from "../db/client";

type SlotRow = {
  id: number;
  date: string;
  shift: string;
  role: string;
  required_skill: string | null;
  employee_id: number | null;
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

function getDayOfWeek(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return dayNames[date.getUTCDay()];
}

function findAssignedSlotByEmployeeAndTime(
  employeeName: string,
  dayOfWeek: string,
  shift: string
) {
  const rows = db
    .prepare(
      `
      SELECT
        ss.id,
        ss.date,
        ss.shift,
        ss.role,
        ss.required_skill,
        ss.employee_id
      FROM shift_slots ss
      JOIN employees e ON e.id = ss.employee_id
      WHERE LOWER(e.name) = LOWER(?)
        AND ss.shift = ?
        AND ss.status = 'assigned'
      ORDER BY ss.date DESC, ss.id DESC
      `
    )
    .all(employeeName, shift) as SlotRow[];

  return rows.find((row) => getDayOfWeek(row.date) === dayOfWeek);
}

function findEmployeeByName(employeeName: string) {
  return db
    .prepare(
      `
      SELECT id, name, role
      FROM employees
      WHERE LOWER(name) = LOWER(?)
      LIMIT 1
      `
    )
    .get(employeeName) as { id: number; name: string; role: string } | undefined;
}

function findBestCandidateForSlot(slot: SlotRow, excludeEmployeeId?: number) {
  const dayOfWeek = getDayOfWeek(slot.date);

  const query = `
    SELECT
      e.id,
      e.name,
      COUNT(ss2.id) as assigned_count
    FROM employees e
    LEFT JOIN employee_availability ea
      ON ea.employee_id = e.id
    LEFT JOIN shift_slots ss2
      ON ss2.employee_id = e.id
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
      AND (
        ? IS NULL
        OR e.id != ?
      )
    GROUP BY e.id, e.name
    ORDER BY assigned_count ASC, e.name ASC
    LIMIT 1
  `;

  return db.prepare(query).get(
    slot.role,
    dayOfWeek,
    slot.shift,
    slot.date,
    slot.shift,
    slot.required_skill,
    slot.required_skill,
    excludeEmployeeId ?? null,
    excludeEmployeeId ?? null
  ) as { id: number; name: string; assigned_count: number } | undefined;
}

export function removeAssignment(slotId: number) {
  const slot = db
    .prepare(
      `
      SELECT id, date, shift, role, required_skill, employee_id
      FROM shift_slots
      WHERE id = ?
      `
    )
    .get(slotId) as SlotRow | undefined;

  if (!slot) {
    return { ok: false, message: "Slot not found." };
  }

  db.prepare(
    `
    UPDATE shift_slots
    SET employee_id = NULL, status = 'open'
    WHERE id = ?
    `
  ).run(slotId);

  return { ok: true, message: "Assignment removed successfully." };
}

export function refillOpenSlot(slotId: number) {
  const slot = db
    .prepare(
      `
      SELECT id, date, shift, role, required_skill, employee_id
      FROM shift_slots
      WHERE id = ?
      `
    )
    .get(slotId) as SlotRow | undefined;

  if (!slot) {
    return { ok: false, message: "Slot not found." };
  }

  if (slot.employee_id !== null) {
    return { ok: false, message: "Slot is already assigned." };
  }

  const candidate = findBestCandidateForSlot(slot);

  if (!candidate) {
    return { ok: false, message: "No available candidate found for this slot." };
  }

  db.prepare(
    `
    UPDATE shift_slots
    SET employee_id = ?, status = 'assigned'
    WHERE id = ?
    `
  ).run(candidate.id, slotId);

  return {
    ok: true,
    message: "Slot refilled successfully.",
    employee: candidate
  };
}

export function replaceAssignment(slotId: number, employeeId: number) {
  const slot = db
    .prepare(
      `
      SELECT id, date, shift, role, required_skill, employee_id
      FROM shift_slots
      WHERE id = ?
      `
    )
    .get(slotId) as SlotRow | undefined;

  if (!slot) {
    return { ok: false, message: "Slot not found." };
  }

  const employee = db
    .prepare(
      `
      SELECT id, name, role
      FROM employees
      WHERE id = ?
      `
    )
    .get(employeeId) as { id: number; name: string; role: string } | undefined;

  if (!employee) {
    return { ok: false, message: "Employee not found." };
  }

  if (employee.role !== slot.role) {
    return { ok: false, message: "Employee role does not match the slot role." };
  }

  const dayOfWeek = getDayOfWeek(slot.date);

  const isAvailable = db
    .prepare(
      `
      SELECT 1
      FROM employee_availability
      WHERE employee_id = ?
        AND day_of_week = ?
        AND shift = ?
        AND is_available = 1
      LIMIT 1
      `
    )
    .get(employeeId, dayOfWeek, slot.shift);

  if (!isAvailable) {
    return { ok: false, message: "Employee is not available for this slot." };
  }

  if (slot.required_skill) {
    const hasSkill = db
      .prepare(
        `
        SELECT 1
        FROM employee_skills
        WHERE employee_id = ?
          AND skill = ?
        LIMIT 1
        `
      )
      .get(employeeId, slot.required_skill);

    if (!hasSkill) {
      return { ok: false, message: "Employee does not have the required skill." };
    }
  }

  const hasConflict = db
    .prepare(
      `
      SELECT 1
      FROM shift_slots
      WHERE employee_id = ?
        AND date = ?
        AND shift = ?
        AND status = 'assigned'
        AND id != ?
      LIMIT 1
      `
    )
    .get(employeeId, slot.date, slot.shift, slot.id);

  if (hasConflict) {
    return { ok: false, message: "Employee is already assigned to this same shift." };
  }

  db.prepare(
    `
    UPDATE shift_slots
    SET employee_id = ?, status = 'assigned'
    WHERE id = ?
    `
  ).run(employeeId, slotId);

  return {
    ok: true,
    message: "Assignment replaced successfully.",
    employee
  };
}

export function removeAndRefill(slotId: number) {
  const slot = db
    .prepare(
      `
      SELECT id, date, shift, role, required_skill, employee_id
      FROM shift_slots
      WHERE id = ?
      `
    )
    .get(slotId) as SlotRow | undefined;

  if (!slot) {
    return { ok: false, message: "Slot not found." };
  }

  const removedEmployeeId = slot.employee_id ?? undefined;

  db.prepare(
    `
    UPDATE shift_slots
    SET employee_id = NULL, status = 'open'
    WHERE id = ?
    `
  ).run(slotId);

  const refreshedSlot = db
    .prepare(
      `
      SELECT id, date, shift, role, required_skill, employee_id
      FROM shift_slots
      WHERE id = ?
      `
    )
    .get(slotId) as SlotRow;

  const candidate = findBestCandidateForSlot(refreshedSlot, removedEmployeeId);

  if (!candidate) {
    return {
      ok: true,
      message: "Assignment removed, but no refill candidate was found."
    };
  }

  db.prepare(
    `
    UPDATE shift_slots
    SET employee_id = ?, status = 'assigned'
    WHERE id = ?
    `
  ).run(candidate.id, slotId);

  return {
    ok: true,
    message: "Assignment removed and slot refilled successfully.",
    employee: candidate
  };
}

export function removeAssignmentByEmployeeAndTime(
  employeeName: string,
  dayOfWeek: string,
  shift: string
) {
  const slot = findAssignedSlotByEmployeeAndTime(employeeName, dayOfWeek, shift);

  if (!slot) {
    return { ok: false, message: "No matching assigned slot found for that employee, day and shift." };
  }

  return removeAssignment(slot.id);
}

export function removeAndRefillByEmployeeAndTime(
  employeeName: string,
  dayOfWeek: string,
  shift: string
) {
  const slot = findAssignedSlotByEmployeeAndTime(employeeName, dayOfWeek, shift);

  if (!slot) {
    return { ok: false, message: "No matching assigned slot found for that employee, day and shift." };
  }

  return removeAndRefill(slot.id);
}

export function replaceAssignmentByEmployeeAndTime(
  fromEmployeeName: string,
  toEmployeeName: string,
  dayOfWeek: string,
  shift: string
) {
  const slot = findAssignedSlotByEmployeeAndTime(fromEmployeeName, dayOfWeek, shift);

  if (!slot) {
    return { ok: false, message: "No matching assigned slot found for the employee you want to replace." };
  }

  const newEmployee = findEmployeeByName(toEmployeeName);

  if (!newEmployee) {
    return { ok: false, message: "Replacement employee not found." };
  }

  return replaceAssignment(slot.id, newEmployee.id);
}
