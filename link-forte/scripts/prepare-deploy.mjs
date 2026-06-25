import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "site/assets/js/supabase-config.js");
const localPath = join(root, "site/assets/js/supabase-config.js");
const examplePath = join(root, "site/assets/js/supabase-config.example.js");

const apiOutPath = join(root, "site/assets/js/api-config.js");
const apiLocalPath = join(root, "site/assets/js/api-config.js");
const apiExamplePath = join(root, "site/assets/js/api-config.example.js");

function readFromFile(path) {
  const content = readFileSync(path, "utf8");
  const url = content.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1];
  const key = content.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)?.[1];
  return { url, key };
}

function readApiFromFile(path) {
  const content = readFileSync(path, "utf8");
  const apiUrl = content.match(/LF_API_BASE_URL\s*=\s*"([^"]+)"/)?.[1];
  return { apiUrl };
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

let apiUrl = process.env.LF_API_BASE_URL?.trim();
const mockApi = process.env.LF_MOCK_API?.trim();

if (!apiUrl) {
  const apiSource = existsSync(apiLocalPath) ? apiLocalPath : apiExamplePath;
  const fromApiFile = readApiFromFile(apiSource);
  apiUrl = fromApiFile.apiUrl || "http://localhost:3001";
}

const useMockApi =
  mockApi === "false" || mockApi === "0"
    ? false
    : mockApi === "true" || mockApi === "1"
      ? true
      : !apiUrl || apiUrl.includes("localhost");

const apiBody = `// Gerado em deploy — não commitar (ver .gitignore)
window.LF_MOCK_API = ${useMockApi};
window.LF_API_BASE_URL = "${apiUrl}";
`;

writeFileSync(apiOutPath, apiBody, "utf8");
console.log(`api-config.js gerado para deploy${apiUrl ? "" : " (sem API Next.js — cupons via Supabase RPC)"}.`);
