export type Role =
  | "manager"
  | "cook"
  | "waiter"
  | "hostess"
  | "dishwasher";

export type Shift = "morning" | "evening";

export interface Employee {
  id: number;
  name: string;
  role: Role;
}

export interface EmployeeSkill {
  id: number;
  employeeId: number;
  skill: string;
}

export interface EmployeeAvailability {
  id: number;
  employeeId: number;
  dayOfWeek: string;
  shift: Shift;
  isAvailable: boolean;
}

export interface ScheduleRule {
  id: number;
  dayOfWeek: string;
  shift: Shift;
  role: Role;
  requiredSkill: string | null;
  quantity: number;
}

export interface ShiftSlot {
  id: number;
  date: string;
  shift: Shift;
  role: Role;
  requiredSkill: string | null;
  employeeId: number | null;
  status: "assigned" | "open";
}
