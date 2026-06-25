import { spawn } from "child_process";
import { createServer } from "net";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const PORT = 3000;
const HOST = "127.0.0.1";
const root = dirname(fileURLToPath(import.meta.url));
const siteDir = join(root, "..", "link-forte", "site");
const serveBin = join(root, "..", "node_modules", "serve", "build", "main.js");

function isPortFree(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

const free = await isPortFree(PORT, HOST);
if (!free) {
  console.error(
    `\nErro: a porta ${PORT} já está em uso.\n` +
      `Feche o outro processo (ex.: outro "npm run dev") e tente de novo.\n` +
      `Site estático deve rodar sempre em http://localhost:${PORT}\n`
  );
  process.exit(1);
}

console.log(`Site estático → http://localhost:${PORT}`);

const child = spawn(process.execPath, [serveBin, siteDir, "-l", `tcp://${HOST}:${PORT}`, "-n"], {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
