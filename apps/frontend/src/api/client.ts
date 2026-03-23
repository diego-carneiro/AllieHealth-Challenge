export type ScheduleApiItem = {
  id: number;
  date: string;
  shift: "morning" | "evening";
  role: string;
  required_skill: string | null;
  employee_id: number | null;
  status: "assigned" | "open";
  employee_name: string | null;
};

const API_BASE_URL = "http://localhost:3000";

export async function fetchSchedule(): Promise<ScheduleApiItem[]> {
  const response = await fetch(`${API_BASE_URL}/schedule`);

  if (!response.ok) {
    throw new Error("Failed to fetch schedule.");
  }

  return response.json();
}
