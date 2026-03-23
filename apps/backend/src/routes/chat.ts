import { Router } from "express";
import { db } from "../db/client";
import { generateWeekSlots } from "../services/scheduler";
import { autofillWeekSlots } from "../services/autofill";
import {
  removeAssignmentByEmployeeAndTime,
  removeAndRefillByEmployeeAndTime,
  replaceAssignmentByEmployeeAndTime
} from "../services/swap";
import { parseChatMessage } from "../services/chatParser";

const router = Router();

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

router.post("/", (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message || !message.trim()) {
    return res.status(400).json({
      ok: false,
      message: "message is required"
    });
  }

  const command = parseChatMessage(message);

  switch (command.type) {
    case "fill_week": {
      const generateResult = generateWeekSlots(command.weekStart);
      const autofillResult = autofillWeekSlots(command.weekStart);

      return res.json({
        ok: true,
        command,
        message: "Week generated and autofill executed.",
        generateResult,
        autofillResult
      });
    }

    case "show_schedule": {
      const schedule = db
        .prepare(
          `
          SELECT
            ss.id,
            ss.date,
            ss.shift,
            ss.role,
            ss.required_skill,
            ss.employee_id,
            ss.status,
            e.name AS employee_name
          FROM shift_slots ss
          LEFT JOIN employees e ON e.id = ss.employee_id
          ORDER BY ss.date, ss.shift, ss.role, ss.id
          `
        )
        .all();

      return res.json({
        ok: true,
        command,
        message: `Loaded ${schedule.length} schedule items.`,
        data: schedule
      });
    }

    case "show_day_schedule": {
      const schedule = db
        .prepare(
          `
          SELECT
            ss.id,
            ss.date,
            ss.shift,
            ss.role,
            ss.required_skill,
            ss.employee_id,
            ss.status,
            e.name AS employee_name
          FROM shift_slots ss
          LEFT JOIN employees e ON e.id = ss.employee_id
          ORDER BY ss.date, ss.shift, ss.role, ss.id
          `
        )
        .all() as Array<{
          id: number;
          date: string;
          shift: string;
          role: string;
          required_skill: string | null;
          employee_id: number | null;
          status: string;
          employee_name: string | null;
        }>;

      const filtered = schedule.filter(
        (item) => getDayOfWeek(item.date) === command.dayOfWeek
      );

      return res.json({
        ok: true,
        command,
        message: `Loaded ${filtered.length} schedule items for ${command.dayOfWeek}.`,
        data: filtered
      });
    }

    case "show_employees": {
      const employees = db
        .prepare(
          `
          SELECT id, name, role
          FROM employees
          ORDER BY name
          `
        )
        .all();

      return res.json({
        ok: true,
        command,
        message: `Loaded ${employees.length} employees.`,
        data: employees
      });
    }

    case "show_rules": {
      const rules = db
        .prepare(
          `
          SELECT id, day_of_week, shift, role, required_skill, quantity
          FROM schedule_rules
          ORDER BY id
          `
        )
        .all();

      return res.json({
        ok: true,
        command,
        message: `Loaded ${rules.length} schedule rules.`,
        data: rules
      });
    }

    case "remove_assignment": {
      const result = removeAssignmentByEmployeeAndTime(
        command.employeeName,
        command.dayOfWeek,
        command.shift
      );
      return res.status(result.ok ? 200 : 400).json(result);
    }

    case "remove_and_refill_assignment": {
      const result = removeAndRefillByEmployeeAndTime(
        command.employeeName,
        command.dayOfWeek,
        command.shift
      );
      return res.status(result.ok ? 200 : 400).json(result);
    }

    case "replace_assignment": {
      const result = replaceAssignmentByEmployeeAndTime(
        command.fromEmployeeName,
        command.toEmployeeName,
        command.dayOfWeek,
        command.shift
      );
      return res.status(result.ok ? 200 : 400).json(result);
    }

    case "unknown":
    default:
      return res.status(400).json({
        ok: false,
        message: "Unknown command.",
        received: message
      });
  }
});

export default router;
