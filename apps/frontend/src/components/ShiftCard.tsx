type ShiftCardProps = {
  role: string;
  requiredSkill?: string | null;
  employeeName?: string | null;
  status: "assigned" | "open";
};

export function ShiftCard({
  role,
  requiredSkill,
  employeeName,
  status
}: ShiftCardProps) {
  return (
    <div className={`shift-card ${status === "open" ? "shift-open" : ""}`}>
      <div className="shift-card-header">
        <strong>{role}</strong>
        {requiredSkill ? <span className="skill-chip">{requiredSkill}</span> : null}
      </div>

      <div className="shift-card-body">
        {status === "assigned" ? (
          <span>{employeeName}</span>
        ) : (
          <span className="open-label">Open slot</span>
        )}
      </div>
    </div>
  );
}
