import { Router } from "express";
import { db } from "../db/client";
import { generateWeekSlots } from "../services/scheduler";
import { autofillWeekSlots } from "../services/autofill";
import { removeAssignment, refillOpenSlot, removeAndRefill } from "../services/swap";
import { parseChatMessage } from "../services/chatParser";

const router = Router();

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
        data: schedule
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
        data: rules
      });
    }

    case "remove_slot": {
      const result = removeAssignment(command.slotId);
      return res.status(result.ok ? 200 : 400).json(result);
    }

    case "refill_slot": {
      const result = refillOpenSlot(command.slotId);
      return res.status(result.ok ? 200 : 400).json(result);
    }

    case "remove_and_refill_slot": {
      const result = removeAndRefill(command.slotId);
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
