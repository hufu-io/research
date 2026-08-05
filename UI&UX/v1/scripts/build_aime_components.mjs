import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const sourceDir = resolve(root, "assets/aime");
const outputDir = resolve(sourceDir, "components");
const checkOnly = process.argv.includes("--check");
const states = [
  { name: "idle", loop: true },
  { name: "thinking", loop: true },
  { name: "greeting", loop: false },
  { name: "peek", loop: false }
];

function componentSource({ name, loop, animationData }) {
  return `window.AimeAnimationComponents.register(${JSON.stringify({ name, loop, animationData })});\n`;
}

async function buildState({ name, loop }) {
  const jsonPath = resolve(sourceDir, `aime_${name}.json`);
  const animationData = JSON.parse(await readFile(jsonPath, "utf8"));
  for (const asset of animationData.assets || []) {
    if (!asset.p || asset.e === 1) continue;
    const imagePath = resolve(sourceDir, asset.u || "", asset.p);
    const image = await readFile(imagePath);
    asset.u = "";
    asset.p = `data:image/png;base64,${image.toString("base64")}`;
    asset.e = 1;
  }
  const outputPath = resolve(outputDir, `aime_${name}.component.js`);
  const expected = componentSource({ name, loop, animationData });
  if (checkOnly) {
    const actual = await readFile(outputPath, "utf8");
    if (actual !== expected) throw new Error(`Outdated AIMe component: ${outputPath}`);
    return;
  }
  await writeFile(outputPath, expected);
}

await mkdir(outputDir, { recursive: true });
await Promise.all(states.map(buildState));
console.log(checkOnly ? "AIMe components are current" : "AIMe components generated");
