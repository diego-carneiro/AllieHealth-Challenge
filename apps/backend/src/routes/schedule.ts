import { Router } from "express";
import { db } from "../db/client";

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

export default router;
