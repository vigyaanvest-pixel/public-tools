import { displayValue } from "../../shared/format";

interface Props {
  label: string;
  value: string | null | undefined;
  hint?: string;
}

export function FieldRow({ label, value, hint }: Props) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-vv-border py-2">
      <span className="text-vv-muted">{label}</span>
      <div className="text-right">
        <span className="font-medium">{displayValue(value)}</span>
        {hint ? (
          <div className="text-xs text-vv-muted">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}
