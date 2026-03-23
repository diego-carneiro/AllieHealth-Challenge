import { db } from "./client";

type Role = "manager" | "cook" | "waiter" | "hostess" | "dishwasher";
type Shift = "morning" | "evening";

type SeedEmployee = {
  name: string;
  role: Role;
  skills: string[];
  offDays: string[];
  preferredShifts: Shift[];
};

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

const shifts: Shift[] = ["morning", "evening"];

const employees: SeedEmployee[] = [
  { name: "Ana Lima", role: "manager", skills: ["opening", "floor-lead"], offDays: ["tuesday", "sunday"], preferredShifts: ["morning"] },
  { name: "Bruno Costa", role: "manager", skills: ["closing", "floor-lead"], offDays: ["monday", "thursday"], preferredShifts: ["evening"] },
  { name: "Carla Mendes", role: "manager", skills: ["opening", "closing", "floor-lead"], offDays: ["wednesday", "saturday"], preferredShifts: ["morning", "evening"] },

  { name: "Diego Rocha", role: "cook", skills: ["grill", "prep"], offDays: ["monday", "friday"], preferredShifts: ["morning", "evening"] },
  { name: "Eduardo Nunes", role: "cook", skills: ["grill", "closing"], offDays: ["tuesday", "sunday"], preferredShifts: ["evening"] },
  { name: "Fernanda Alves", role: "cook", skills: ["prep", "opening"], offDays: ["thursday", "saturday"], preferredShifts: ["morning"] },
  { name: "Gabriel Souza", role: "cook", skills: ["saute", "closing"], offDays: ["wednesday", "sunday"], preferredShifts: ["evening"] },
  { name: "Helena Martins", role: "cook", skills: ["pastry", "prep"], offDays: ["monday", "thursday"], preferredShifts: ["morning"] },

  { name: "Igor Santos", role: "waiter", skills: ["wine-service", "opening"], offDays: ["tuesday", "friday"], preferredShifts: ["morning", "evening"] },
  { name: "Julia Ferreira", role: "waiter", skills: ["wine-service"], offDays: ["monday", "wednesday"], preferredShifts: ["evening"] },
  { name: "Kaique Ribeiro", role: "waiter", skills: ["opening"], offDays: ["thursday", "sunday"], preferredShifts: ["morning"] },
  { name: "Larissa Gomes", role: "waiter", skills: ["closing"], offDays: ["tuesday", "saturday"], preferredShifts: ["evening"] },
  { name: "Marcos Carvalho", role: "waiter", skills: ["floor-lead"], offDays: ["monday", "friday"], preferredShifts: ["morning", "evening"] },
  { name: "Natalia Barros", role: "waiter", skills: ["wine-service", "closing"], offDays: ["wednesday", "sunday"], preferredShifts: ["evening"] },
  { name: "Otavio Silva", role: "waiter", skills: ["opening"], offDays: ["thursday", "saturday"], preferredShifts: ["morning"] },
  { name: "Paula Teixeira", role: "waiter", skills: ["closing"], offDays: ["monday", "thursday"], preferredShifts: ["evening"] },
  { name: "Rafael Moura", role: "waiter", skills: ["wine-service"], offDays: ["tuesday", "friday"], preferredShifts: ["morning", "evening"] },
  { name: "Sofia Araujo", role: "waiter", skills: ["opening", "closing"], offDays: ["wednesday", "saturday"], preferredShifts: ["morning", "evening"] },

  { name: "Talita Pires", role: "hostess", skills: ["cashier", "opening"], offDays: ["monday", "friday"], preferredShifts: ["morning"] },
  { name: "Ueslei Batista", role: "hostess", skills: ["cashier", "closing"], offDays: ["tuesday", "sunday"], preferredShifts: ["evening"] },
  { name: "Vanessa Duarte", role: "hostess", skills: ["cashier", "opening", "closing"], offDays: ["wednesday", "thursday"], preferredShifts: ["morning", "evening"] },

  { name: "William Cruz", role: "dishwasher", skills: ["opening"], offDays: ["monday", "saturday"], preferredShifts: ["morning"] },
  { name: "Xavier Lopes", role: "dishwasher", skills: ["closing"], offDays: ["tuesday", "friday"], preferredShifts: ["evening"] },
  { name: "Yasmin Freitas", role: "dishwasher", skills: ["opening", "closing"], offDays: ["wednesday", "sunday"], preferredShifts: ["morning", "evening"] },
  { name: "Zeca Moreira", role: "dishwasher", skills: ["closing"], offDays: ["thursday", "saturday"], preferredShifts: ["evening"] }
];

const weeklyRules = [
  { day: "monday", shift: "morning", role: "manager", requiredSkill: "opening", quantity: 1 },
  { day: "monday", shift: "morning", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "monday", shift: "morning", role: "waiter", requiredSkill: null, quantity: 3 },
  { day: "monday", shift: "morning", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "monday", shift: "morning", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "monday", shift: "evening", role: "manager", requiredSkill: "closing", quantity: 1 },
  { day: "monday", shift: "evening", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "monday", shift: "evening", role: "waiter", requiredSkill: null, quantity: 4 },
  { day: "monday", shift: "evening", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "monday", shift: "evening", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "tuesday", shift: "morning", role: "manager", requiredSkill: "opening", quantity: 1 },
  { day: "tuesday", shift: "morning", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "tuesday", shift: "morning", role: "waiter", requiredSkill: null, quantity: 3 },
  { day: "tuesday", shift: "morning", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "tuesday", shift: "morning", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "tuesday", shift: "evening", role: "manager", requiredSkill: "closing", quantity: 1 },
  { day: "tuesday", shift: "evening", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "tuesday", shift: "evening", role: "waiter", requiredSkill: null, quantity: 4 },
  { day: "tuesday", shift: "evening", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "tuesday", shift: "evening", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "wednesday", shift: "morning", role: "manager", requiredSkill: "opening", quantity: 1 },
  { day: "wednesday", shift: "morning", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "wednesday", shift: "morning", role: "waiter", requiredSkill: null, quantity: 3 },
  { day: "wednesday", shift: "morning", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "wednesday", shift: "morning", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "wednesday", shift: "evening", role: "manager", requiredSkill: "closing", quantity: 1 },
  { day: "wednesday", shift: "evening", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "wednesday", shift: "evening", role: "waiter", requiredSkill: null, quantity: 4 },
  { day: "wednesday", shift: "evening", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "wednesday", shift: "evening", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "thursday", shift: "morning", role: "manager", requiredSkill: "opening", quantity: 1 },
  { day: "thursday", shift: "morning", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "thursday", shift: "morning", role: "waiter", requiredSkill: null, quantity: 3 },
  { day: "thursday", shift: "morning", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "thursday", shift: "morning", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "thursday", shift: "evening", role: "manager", requiredSkill: "closing", quantity: 1 },
  { day: "thursday", shift: "evening", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "thursday", shift: "evening", role: "waiter", requiredSkill: null, quantity: 4 },
  { day: "thursday", shift: "evening", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "thursday", shift: "evening", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "friday", shift: "morning", role: "manager", requiredSkill: "opening", quantity: 1 },
  { day: "friday", shift: "morning", role: "cook", requiredSkill: null, quantity: 2 },
  { day: "friday", shift: "morning", role: "waiter", requiredSkill: null, quantity: 4 },
  { day: "friday", shift: "morning", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "friday", shift: "morning", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "friday", shift: "evening", role: "manager", requiredSkill: "closing", quantity: 1 },
  { day: "friday", shift: "evening", role: "cook", requiredSkill: null, quantity: 3 },
  { day: "friday", shift: "evening", role: "waiter", requiredSkill: null, quantity: 6 },
  { day: "friday", shift: "evening", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "friday", shift: "evening", role: "dishwasher", requiredSkill: null, quantity: 2 },

  { day: "saturday", shift: "morning", role: "manager", requiredSkill: "opening", quantity: 1 },
  { day: "saturday", shift: "morning", role: "cook", requiredSkill: null, quantity: 3 },
  { day: "saturday", shift: "morning", role: "waiter", requiredSkill: null, quantity: 5 },
  { day: "saturday", shift: "morning", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "saturday", shift: "morning", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "saturday", shift: "evening", role: "manager", requiredSkill: "closing", quantity: 1 },
  { day: "saturday", shift: "evening", role: "cook", requiredSkill: null, quantity: 4 },
  { day: "saturday", shift: "evening", role: "waiter", requiredSkill: null, quantity: 8 },
  { day: "saturday", shift: "evening", role: "hostess", requiredSkill: "cashier", quantity: 2 },
  { day: "saturday", shift: "evening", role: "dishwasher", requiredSkill: null, quantity: 2 },

  { day: "sunday", shift: "morning", role: "manager", requiredSkill: "opening", quantity: 1 },
  { day: "sunday", shift: "morning", role: "cook", requiredSkill: null, quantity: 3 },
  { day: "sunday", shift: "morning", role: "waiter", requiredSkill: null, quantity: 5 },
  { day: "sunday", shift: "morning", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "sunday", shift: "morning", role: "dishwasher", requiredSkill: null, quantity: 1 },

  { day: "sunday", shift: "evening", role: "manager", requiredSkill: "closing", quantity: 1 },
  { day: "sunday", shift: "evening", role: "cook", requiredSkill: null, quantity: 3 },
  { day: "sunday", shift: "evening", role: "waiter", requiredSkill: null, quantity: 5 },
  { day: "sunday", shift: "evening", role: "hostess", requiredSkill: "cashier", quantity: 1 },
  { day: "sunday", shift: "evening", role: "dishwasher", requiredSkill: null, quantity: 2 }
] as const;

export function seedDatabase() {
  const insertEmployee = db.prepare(`
    INSERT INTO employees (name, role)
    VALUES (?, ?)
  `);

  const insertSkill = db.prepare(`
    INSERT INTO employee_skills (employee_id, skill)
    VALUES (?, ?)
  `);

  const insertAvailability = db.prepare(`
    INSERT INTO employee_availability (employee_id, day_of_week, shift, is_available)
    VALUES (?, ?, ?, ?)
  `);

  const insertRule = db.prepare(`
    INSERT INTO schedule_rules (day_of_week, shift, role, required_skill, quantity)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const employee of employees) {
      const employeeResult = insertEmployee.run(employee.name, employee.role);
      const employeeId = Number(employeeResult.lastInsertRowid);

      for (const skill of employee.skills) {
        insertSkill.run(employeeId, skill);
      }

      for (const day of daysOfWeek) {
        for (const shift of shifts) {
          const isAvailable =
            !employee.offDays.includes(day) &&
            employee.preferredShifts.includes(shift)
              ? 1
              : 0;

          insertAvailability.run(employeeId, day, shift, isAvailable);
        }
      }
    }

    for (const rule of weeklyRules) {
      insertRule.run(
        rule.day,
        rule.shift,
        rule.role,
        rule.requiredSkill,
        rule.quantity
      );
    }
  });

  insertAll();
}
