import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const sourcePath = resolve(root, "assets/aime/aime_peek.json");
const outputPath = resolve(root, "assets/aime/aime_peek2.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));

function rename(value) {
  if (Array.isArray(value)) return value.map(rename);
  if (!value || typeof value !== "object") return typeof value === "string" ? value.replaceAll("peek", "peek2") : value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rename(entry)]));
}

function rectangle(name, position, size, color, opacity = 100, radius = 0) {
  return {
    ty: "gr",
    nm: name,
    it: [
      { ty: "rc", p: { a: 0, k: position }, s: { a: 0, k: size }, r: { a: 0, k: radius }, d: 1, nm: `${name} Shape` },
      { ty: "fl", c: { a: 0, k: color }, o: { a: 0, k: opacity }, r: 1, nm: `${name} Fill` },
      { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: `${name} Transform` }
    ]
  };
}

const animation = rename(source);
animation.nm = "AIMe peek2 Static Doorframe Animation";
animation.markers.forEach((marker) => {
  marker.cm = marker.cm.replace("peek2", "peek");
});
animation.assets.find(({ id }) => id === "aime_peek2_image").p = "aime_peek.png";
animation.layers[0].ind = 2;
animation.layers[0].ks.p.k = [
  { t: 0, s: [466, 256], e: [378, 256], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 15, s: [378, 256], e: [376, 254], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 45, s: [376, 254], e: [378, 256], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 75, s: [378, 256], e: [466, 256], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 90, s: [466, 256] }
];
animation.layers[0].ks.s.k = [
  { t: 0, s: [128, 128], e: [132, 132], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 15, s: [132, 132], e: [135, 135], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 45, s: [135, 135], e: [132, 132], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 75, s: [132, 132], e: [128, 128], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } },
  { t: 90, s: [128, 128] }
];
animation.layers.unshift({
  ddd: 0,
  ind: 1,
  ty: 4,
  nm: "AIMe peek2 Static Wooden Doorframe",
  sr: 1,
  ks: {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] }
  },
  ao: 0,
  shapes: [
    rectangle("Frame Shadow", [482, 261], [10, 474], [0.20, 0.10, 0.05, 1], 24, 3),
    rectangle("Frame Dark Edge", [488, 261], [8, 474], [0.38, 0.18, 0.07, 1], 100, 3),
    rectangle("Frame Main Wood", [500, 261], [20, 474], [0.65, 0.36, 0.14, 1], 100, 3),
    rectangle("Frame Warm Grain", [495, 261], [4, 468], [0.83, 0.53, 0.24, 1], 78, 2),
    rectangle("Frame Highlight", [491, 261], [2, 466], [0.96, 0.73, 0.39, 1], 82, 1),
    rectangle("Frame Inner Shade", [507, 261], [5, 470], [0.45, 0.22, 0.08, 1], 72, 2)
  ],
  ip: 0,
  op: 90,
  st: 0,
  bm: 0
});

await writeFile(outputPath, `${JSON.stringify(animation)}\n`);
console.log("AIMe peek2 source generated");
