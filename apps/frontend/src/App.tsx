import "./App.css";
import { ScheduleBoard } from "./components/ScheduleBoard";

const mockSchedule = [
  { id: 1, day: "Monday", shift: "morning", role: "manager", requiredSkill: "opening", employeeName: "Ana Lima", status: "assigned" },
  { id: 2, day: "Monday", shift: "morning", role: "cook", requiredSkill: null, employeeName: "Diego Rocha", status: "assigned" },
  { id: 3, day: "Monday", shift: "morning", role: "waiter", requiredSkill: null, employeeName: null, status: "open" },
  { id: 4, day: "Monday", shift: "evening", role: "manager", requiredSkill: "closing", employeeName: "Bruno Costa", status: "assigned" },
  { id: 5, day: "Monday", shift: "evening", role: "waiter", requiredSkill: null, employeeName: "Sofia Araujo", status: "assigned" },

  { id: 6, day: "Tuesday", shift: "morning", role: "hostess", requiredSkill: "cashier", employeeName: "Talita Pires", status: "assigned" },
  { id: 7, day: "Tuesday", shift: "evening", role: "dishwasher", requiredSkill: null, employeeName: null, status: "open" },

  { id: 8, day: "Wednesday", shift: "morning", role: "cook", requiredSkill: null, employeeName: "Fernanda Alves", status: "assigned" },
  { id: 9, day: "Wednesday", shift: "evening", role: "waiter", requiredSkill: "wine-service", employeeName: "Natalia Barros", status: "assigned" },

  { id: 10, day: "Thursday", shift: "morning", role: "manager", requiredSkill: "opening", employeeName: null, status: "open" },
  { id: 11, day: "Thursday", shift: "evening", role: "cook", requiredSkill: null, employeeName: "Gabriel Souza", status: "assigned" },

  { id: 12, day: "Friday", shift: "morning", role: "waiter", requiredSkill: null, employeeName: "Rafael Moura", status: "assigned" },
  { id: 13, day: "Friday", shift: "evening", role: "dishwasher", requiredSkill: null, employeeName: null, status: "open" },

  { id: 14, day: "Saturday", shift: "morning", role: "hostess", requiredSkill: "cashier", employeeName: "Vanessa Duarte", status: "assigned" },
  { id: 15, day: "Saturday", shift: "evening", role: "waiter", requiredSkill: null, employeeName: null, status: "open" },

  { id: 16, day: "Sunday", shift: "morning", role: "cook", requiredSkill: null, employeeName: "Helena Martins", status: "assigned" },
  { id: 17, day: "Sunday", shift: "evening", role: "manager", requiredSkill: "closing", employeeName: null, status: "open" }
] as const;

function App() {
  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AllieHealth Challenge</p>
          <h1>Restaurant Scheduler</h1>
          <p className="subtitle">
            Weekly schedule view for restaurant staffing coverage.
          </p>
        </div>
      </header>

      <ScheduleBoard items={[...mockSchedule]} />
    </main>
  );
}

export default App;
