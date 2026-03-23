import { Router } from "express";
import { db } from "../db/client";
import { generateWeekSlots } from "../services/scheduler";
import { autofillWeekSlots } from "../services/autofill";

const router = Router();

router.get("/", (_req, res) => {
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

  res.json(schedule);
});

router.post("/generate", (req, res) => {
  const { weekStart } = req.body as { weekStart?: string };

  if (!weekStart) {
    return res.status(400).json({
      ok: false,
      message: "weekStart is required in format YYYY-MM-DD"
    });
  }

  const result = generateWeekSlots(weekStart);

  return res.json({
    ok: true,
    ...result
  });
});

router.post("/autofill", (req, res) => {
  const { weekStart } = req.body as { weekStart?: string };

  if (!weekStart) {
    return res.status(400).json({
      ok: false,
      message: "weekStart is required in format YYYY-MM-DD"
    });
  }

  const result = autofillWeekSlots(weekStart);

  return res.json({
    ok: true,
    ...result
  });
});

export default router;
