import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const source = resolve(scriptDir, "../src/config/analytics-metrics.json");
const frontendCopy = resolve(scriptDir, "../../frontend/lib/analytics-metrics.json");

await mkdir(dirname(frontendCopy), { recursive: true });
await copyFile(source, frontendCopy);
console.log("Definisi metrik analytics disinkronkan ke frontend/lib/analytics-metrics.json.");
