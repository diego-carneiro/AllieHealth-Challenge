type ShiftCardProps = {
  role: string;
  requiredSkill?: string | null;
  employeeName?: string | null;
  status: "assigned" | "open";
};

function getRoleClass(role: string) {
  switch (role.toLowerCase()) {
    case "manager":
      return "role-manager";
    case "cook":
      return "role-cook";
    case "waiter":
      return "role-waiter";
    case "hostess":
      return "role-hostess";
    case "dishwasher":
      return "role-dishwasher";
    default:
      return "";
  }
}

export function ShiftCard({
  role,
  requiredSkill,
  employeeName,
  status
}: ShiftCardProps) {
  return (
    <div className={`shift-card ${getRoleClass(role)} ${status === "open" ? "shift-open" : ""}`}>
      <div className="shift-card-header">
        <div className="shift-card-title-row">
          <strong>{role}</strong>
          <span className={`status-pill ${status === "assigned" ? "status-assigned" : "status-open"}`}>
            {status === "assigned" ? "Assigned" : "Open"}
          </span>
        </div>

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
