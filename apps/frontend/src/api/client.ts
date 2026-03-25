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

export type ChatApiResponse = {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
};

const API_BASE_URL = "http://localhost:3000";

export async function fetchSchedule(): Promise<ScheduleApiItem[]> {
  const response = await fetch(`${API_BASE_URL}/schedule`);

  if (!response.ok) {
    throw new Error("Failed to fetch schedule.");
  }

  return response.json();
}

export async function sendChatMessage(
  message: string,
): Promise<ChatApiResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Failed to send chat message.");
  }

  return data;
}
