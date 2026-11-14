import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "src");
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const jsFiles = await walk(sourceRoot);
for (const file of jsFiles.filter(path => path.endsWith(".js"))) {
  const source = await readFile(file, "utf8");
  const importPattern = /(?:from\s*|import\s*)["'](\.[^"']+)["']/g;
  for (const match of source.matchAll(importPattern)) {
    const target = resolve(dirname(file), match[1]);
    try {
      await stat(target);
    } catch {
      failures.push(`${file.replace(root + "/", "")}: missing import ${match[1]}`);
    }
  }
}

const html = await readFile(join(root, "index.html"), "utf8");
for (const match of html.matchAll(/(?:src|href)=["'](\.{1,2}\/[^"']+)["']/g)) {
  const target = resolve(root, match[1]);
  try {
    await stat(target);
  } catch {
    failures.push(`index.html: missing local reference ${match[1]}`);
  }
}
if (!html.includes('type="module"') || !html.includes("./src/main.js")) {
  failures.push("index.html does not load the ES module entry point");
}
if (!html.includes("three@0.128.0") || !html.includes("r128")) {
  failures.push("Three.js core and example loaders must use matching r128 versions");
}

if (failures.length) {
  process.stderr.write(failures.join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`Project check passed: ${jsFiles.filter(path => path.endsWith(".js")).length} modules and local HTML references resolved.\n`);
}
