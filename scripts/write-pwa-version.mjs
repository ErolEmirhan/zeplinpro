/**
 * package.json "version" → public/pwa-version.txt
 * Her dağıtımda önce package.json sürümünü artırın; prebuild bunu dosyaya yazar.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = String(pkg.version ?? "0.0.0").trim();
writeFileSync(join(root, "public", "pwa-version.txt"), `${version}\n`, "utf8");
console.log(`[pwa] public/pwa-version.txt → ${version}`);
