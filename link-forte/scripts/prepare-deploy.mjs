import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "site/assets/js/supabase-config.js");
const localPath = join(root, "site/assets/js/supabase-config.js");
const examplePath = join(root, "site/assets/js/supabase-config.example.js");

function readFromFile(path) {
  const content = readFileSync(path, "utf8");
  const url = content.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1];
  const key = content.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)?.[1];
  return { url, key };
}

let url = process.env.SUPABASE_URL?.trim();
let key = process.env.SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  const source = existsSync(localPath) ? localPath : examplePath;
  const fromFile = readFromFile(source);
  url = url || fromFile.url;
  key = key || fromFile.key;
}

if (!url || !key) {
  throw new Error(
    "Defina SUPABASE_URL e SUPABASE_ANON_KEY (env) ou mantenha site/assets/js/supabase-config.js local."
  );
}

if (key.startsWith("sb_secret_") || key === "cole_sua_anon_key_aqui") {
  throw new Error("Use a anon/publishable key, não a secret key.");
}

const body = `// Gerado em deploy — não commitar (ver .gitignore)
window.SUPABASE_URL = "${url}";
window.SUPABASE_ANON_KEY = "${key}";
`;

writeFileSync(outPath, body, "utf8");
console.log("supabase-config.js gerado para deploy.");
