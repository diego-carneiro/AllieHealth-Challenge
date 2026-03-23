import { Router } from "express";
import { db } from "../db/client";
import { generateWeekSlots } from "../services/scheduler";
import { autofillWeekSlots } from "../services/autofill";
import {
  removeAssignment,
  refillOpenSlot,
  replaceAssignment,
  removeAndRefill
} from "../services/swap";

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

router.post("/:slotId/remove", (req, res) => {
  const slotId = Number(req.params.slotId);
  const result = removeAssignment(slotId);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

router.post("/:slotId/refill", (req, res) => {
  const slotId = Number(req.params.slotId);
  const result = refillOpenSlot(slotId);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

router.post("/:slotId/remove-and-refill", (req, res) => {
  const slotId = Number(req.params.slotId);
  const result = removeAndRefill(slotId);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

router.post("/:slotId/replace", (req, res) => {
  const slotId = Number(req.params.slotId);
  const { employeeId } = req.body as { employeeId?: number };

  if (!employeeId) {
    return res.status(400).json({
      ok: false,
      message: "employeeId is required."
    });
  }

  const result = replaceAssignment(slotId, employeeId);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

export default router;
