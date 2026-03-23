import { CoverageBadge } from "./CoverageBadge";
import { ShiftCard } from "./ShiftCard";

type ScheduleItem = {
  id: number;
  shift: "morning" | "evening";
  role: string;
  requiredSkill?: string | null;
  employeeName?: string | null;
  status: "assigned" | "open";
};

type DayColumnProps = {
  dayLabel: string;
  coverage: "complete" | "partial" | "empty";
  items: ScheduleItem[];
};

export function DayColumn({ dayLabel, coverage, items }: DayColumnProps) {
  const morningItems = items.filter((item) => item.shift === "morning");
  const eveningItems = items.filter((item) => item.shift === "evening");

  return (
    <section className="day-column">
      <div className="day-column-header">
        <h2>{dayLabel}</h2>
        <CoverageBadge status={coverage} />
      </div>

      <div className="shift-group">
        <h3>Morning</h3>
        <div className="shift-list">
          {morningItems.length > 0 ? (
            morningItems.map((item) => (
              <ShiftCard
                key={item.id}
                role={item.role}
                requiredSkill={item.requiredSkill}
                employeeName={item.employeeName}
                status={item.status}
              />
            ))
          ) : (
            <div className="empty-shift-group">No morning slots</div>
          )}
        </div>
      </div>

      <div className="shift-group">
        <h3>Evening</h3>
        <div className="shift-list">
          {eveningItems.length > 0 ? (
            eveningItems.map((item) => (
              <ShiftCard
                key={item.id}
                role={item.role}
                requiredSkill={item.requiredSkill}
                employeeName={item.employeeName}
                status={item.status}
              />
            ))
          ) : (
            <div className="empty-shift-group">No evening slots</div>
          )}
        </div>
      </div>
    </section>
  );
}
