import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { ScheduleBoard } from "./components/ScheduleBoard";
import { fetchSchedule, type ScheduleApiItem } from "./api/client";

type BoardItem = {
  id: number;
  day: string;
  shift: "morning" | "evening";
  role: string;
  requiredSkill?: string | null;
  employeeName?: string | null;
  status: "assigned" | "open";
};

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function formatDayFromDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return dayNames[date.getUTCDay()];
}

function App() {
  const [schedule, setSchedule] = useState<ScheduleApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchSchedule();
        setSchedule(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  const boardItems = useMemo<BoardItem[]>(() => {
    return schedule.map((item) => ({
      id: item.id,
      day: formatDayFromDate(item.date),
      shift: item.shift,
      role: item.role,
      requiredSkill: item.required_skill,
      employeeName: item.employee_name,
      status: item.status
    }));
  }, [schedule]);

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <h1>Restaurant Scheduler</h1>
          <p className="subtitle">
            Weekly schedule view for restaurant staffing coverage.
          </p>
        </div>
      </header>

      {loading ? <p className="info-banner">Loading schedule...</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      {!loading && !error && boardItems.length === 0 ? (
        <p className="info-banner">
          No schedule slots found yet. Generate and autofill the week from the backend.
        </p>
      ) : null}

      {!loading && !error && boardItems.length > 0 ? (
        <ScheduleBoard items={boardItems} />
      ) : null}
    </main>
  );
}

export default App;
