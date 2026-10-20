const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
let checked = 0;
function checkDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", "data", "uploads"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      checkDirectory(file);
    } else if (entry.name.endsWith(".js")) {
      new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
      checked++;
    } else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(file, "utf8");
      for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
        new vm.Script(match[1], { filename: file });
        checked++;
      }
      for (const match of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
        const asset = match[1].split("?")[0];
        if (asset.startsWith("/socket.io/") || !path.extname(asset)) continue;
        if (!fs.existsSync(path.join(root, "public", asset))) {
          throw new Error(`Arquivo ausente em ${entry.name}: ${asset}`);
        }
      }
    }
  }
}
checkDirectory(root);
console.log(`${checked} scripts verificados; referências HTML válidas.`);
