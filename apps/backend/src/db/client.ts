import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.resolve(__dirname, "../../data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");

export const db = new Database(dbPath);
