import { Router } from "express";
import { db } from "../db/client";

const router = Router();

router.get("/", (_req, res) => {
  const employees = db
    .prepare(
      `
      SELECT id, name, role
      FROM employees
      ORDER BY name
      `
    )
    .all();

  res.json(employees);
});

export default router;
