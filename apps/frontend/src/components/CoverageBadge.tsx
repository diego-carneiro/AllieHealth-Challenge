type CoverageStatus = "complete" | "partial" | "empty";

type CoverageBadgeProps = {
  status: CoverageStatus;
};

const labelByStatus: Record<CoverageStatus, string> = {
  complete: "Complete",
  partial: "Partial",
  empty: "Empty"
};

export function CoverageBadge({ status }: CoverageBadgeProps) {
  return (
    <span className={`coverage-badge coverage-${status}`}>
      {labelByStatus[status]}
    </span>
  );
}
