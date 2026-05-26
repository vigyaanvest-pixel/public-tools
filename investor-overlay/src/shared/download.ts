import type { ExportPayload } from "./types";

export function downloadJson(payload: ExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `symbol-360-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
