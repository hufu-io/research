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
  { name: "peek", loop: false },
  { name: "peek2", loop: false }
];

function componentSource({ name, loop, animationData, fallbackImage }) {
  return `window.AimeAnimationComponents.register(${JSON.stringify({ name, loop, animationData, fallbackImage })});\n`;
}

async function buildState({ name, loop }) {
  const jsonPath = resolve(sourceDir, `aime_${name}.json`);
  const animationData = JSON.parse(await readFile(jsonPath, "utf8"));
  const fallback = await readFile(resolve(sourceDir, "images", `aime_${name}.png`));
  const fallbackImage = `data:image/png;base64,${fallback.toString("base64")}`;
  const imageAssets = animationData.assets?.filter(({ p }) => typeof p === "string" && !p.startsWith("data:")) || [];
  if (!imageAssets.length) throw new Error(`Missing AIMe image asset: ${jsonPath}`);
  await Promise.all(imageAssets.map(async (imageAsset) => {
    const image = await readFile(resolve(sourceDir, imageAsset.u || "", imageAsset.p));
    imageAsset.u = "";
    imageAsset.p = `data:image/png;base64,${image.toString("base64")}`;
    imageAsset.e = 1;
  }));
  const outputPath = resolve(outputDir, `aime_${name}.component.js`);
  const expected = componentSource({ name, loop, animationData, fallbackImage });
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
