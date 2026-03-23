import { Router } from "express";
import { db } from "../db/client";

const router = Router();

router.get("/", (_req, res) => {
  const rules = db
    .prepare(
      `
      SELECT id, day_of_week, shift, role, required_skill, quantity
      FROM schedule_rules
      ORDER BY
        CASE day_of_week
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END,
        CASE shift
          WHEN 'morning' THEN 1
          WHEN 'evening' THEN 2
        END,
        role
      `
    )
    .all();

  res.json(rules);
});

export default router;
