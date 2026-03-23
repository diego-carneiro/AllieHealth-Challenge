import { db } from "./client";
import { createSchema } from "./schema";
import { seedDatabase } from "./seed";

function initDatabase() {
  createSchema();

  const employeesCount = db
    .prepare("SELECT COUNT(*) as count FROM employees")
    .get() as { count: number };

  const rulesCount = db
    .prepare("SELECT COUNT(*) as count FROM schedule_rules")
    .get() as { count: number };

  if (employeesCount.count === 0 && rulesCount.count === 0) {
    seedDatabase();
    console.log("Seed data inserted successfully.");
  } else {
    console.log("Seed skipped because data already exists.");
  }

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();

  console.log("Database initialized successfully.");
  console.log("Tables:");
  console.log(tables);
}

initDatabase();
