import { DayColumn } from "./DayColumn";

type ScheduleItem = {
  id: number;
  day: string;
  shift: "morning" | "evening";
  role: string;
  requiredSkill?: string | null;
  employeeName?: string | null;
  status: "assigned" | "open";
};

type DayCoverage = "complete" | "partial" | "empty";

type ScheduleBoardProps = {
  items: ScheduleItem[];
};

const orderedDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

function getCoverage(items: ScheduleItem[]): DayCoverage {
  if (items.length === 0) return "empty";

  const assignedCount = items.filter((item) => item.status === "assigned").length;

  if (assignedCount === 0) return "empty";
  if (assignedCount === items.length) return "complete";
  return "partial";
}

export function ScheduleBoard({ items }: ScheduleBoardProps) {
  return (
    <div className="schedule-board">
      {orderedDays.map((day) => {
        const dayItems = items.filter((item) => item.day === day);

        return (
          <DayColumn
            key={day}
            dayLabel={day}
            coverage={getCoverage(dayItems)}
            items={dayItems}
          />
        );
      })}
    </div>
  );
}
