import { displayValue } from "../../shared/format";

interface Props {
  label: string;
  value: string | null | undefined;
  positive?: boolean;
}

export function MetricCard({ label, value, positive }: Props) {
  const disp = displayValue(value);
  const isDash = disp === "—";
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value${isDash ? " dash" : positive ? " positive" : ""}`}>
        {disp}
      </div>
    </div>
  );
}
