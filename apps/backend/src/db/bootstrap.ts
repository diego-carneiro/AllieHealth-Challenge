import { db } from "./client";
import { createSchema } from "./schema";
import { seedDatabase } from "./seed";
import { generateWeekSlots } from "../services/scheduler";
import { autofillWeekSlots } from "../services/autofill";

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay(); // sunday 0 ... saturday 6
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function bootstrapDatabase() {
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

  const weekStart = getCurrentMonday();

  const generateResult = generateWeekSlots(weekStart);
  console.log("Schedule generation:", generateResult);

  const autofillResult = autofillWeekSlots(weekStart);
  console.log("Autofill result:", autofillResult);

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();

  console.log("Database bootstrap completed.");
  console.log("Week start:", weekStart);
  console.log("Tables:");
  console.log(tables);
}

bootstrapDatabase();
