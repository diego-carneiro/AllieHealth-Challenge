import { db } from "./client";

export function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      skill TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS employee_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL,
      shift TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS schedule_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week TEXT NOT NULL,
      shift TEXT NOT NULL,
      role TEXT NOT NULL,
      required_skill TEXT,
      quantity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shift_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      role TEXT NOT NULL,
      required_skill TEXT,
      employee_id INTEGER,
      status TEXT NOT NULL CHECK(status IN ('assigned', 'open')),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);
}
