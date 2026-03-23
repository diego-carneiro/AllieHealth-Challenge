import { db } from "./client";
import { createSchema } from "./schema";

function initDatabase() {
  createSchema();

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();

  console.log("Database initialized successfully.");
  console.log("Tables:");
  console.log(tables);
}

initDatabase();
