import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const text = `# Load this folder in Edge / Chrome

Select this **dist** folder when using **Load unpacked** in \`edge://extensions\` or \`chrome://extensions\`.

Rebuild: \`npm run build\` from the parent investor-overlay folder.
`;
fs.writeFileSync(path.join(dist, "LOAD.md"), text);
console.log("wrote dist/LOAD.md");
