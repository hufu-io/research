import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const read = (path) => readFile(resolve(root, path), "utf8");
const states = [
  { name: "idle", loop: true },
  { name: "thinking", loop: true },
  { name: "greeting", loop: false },
  { name: "peek", loop: false }
];

const [html, css, js, componentRuntime, peekSource] = await Promise.all([
  read("index.html"),
  read("ui.css"),
  read("ui.js"),
  read("components/aime_animation_component.js"),
  read("assets/aime/aime_peek.json")
]);
const peek = JSON.parse(peekSource);

assert.match(html, /class="aime-fab is-collapsed"/, "AIMe must start collapsed");
assert.match(html, /data-state="peek"/, "Initial markup must select the peek fallback");
assert.match(html, /aria-label="展开 Aime 智能助手"/, "Initial accessibility label must describe expansion");
assert.match(html, /ui\.css\?v=31/, "AIMe styles must use the current cache version");
assert.match(html, /ui\.js\?v=21/, "Direct peek replacement must invalidate the script cache");
assert.match(html, /components\/aime_animation_component\.js\?v=1/, "The component runtime must load before state components");

for (const { name, loop } of states) {
  assert.match(html, new RegExp(`assets/aime/components/aime_${name}\\.component\\.js\\?v=1`), `${name} component must be loaded`);
  const componentSource = await read(`assets/aime/components/aime_${name}.component.js`);
  const match = componentSource.match(/^window\.AimeAnimationComponents\.register\((.*)\);\n$/s);
  assert.ok(match, `${name} must be a registered component`);
  const component = JSON.parse(match[1]);
  assert.equal(component.name, name, `${name} component name must match its state`);
  assert.equal(component.loop, loop, `${name} loop behavior must stay encapsulated`);
  assert.ok(component.animationData.layers?.length > 0, `${name} must contain animation layers`);
  const imageAsset = component.animationData.assets?.find(({ p }) => p?.startsWith("data:image/png;base64,"));
  assert.ok(imageAsset, `${name} must embed its PNG as a Data URI`);
  assert.equal(imageAsset.e, 1, `${name} embedded image flag must be enabled`);
  assert.equal(imageAsset.u, "", `${name} must not retain an external image directory`);
  const sourceImage = await readFile(resolve(root, "assets/aime/images", `aime_${name}.png`));
  assert.equal(imageAsset.p, `data:image/png;base64,${sourceImage.toString("base64")}`, `${name} must embed the matching PNG`);
}

assert.match(componentRuntime, /animationData:\s*JSON\.parse\(JSON\.stringify\(this\.animationData\)\)/, "Each mount must clone its animation data");
assert.match(componentRuntime, /container\.style\.setProperty\("--aime-fallback-image"/, "Each component must own its fallback image");
assert.match(componentRuntime, /this\.markers = new Map/, "Each component must own its marker map");
assert.match(js, /const aimeComponents = window\.AimeAnimationComponents;/, "The state layer must consume the component registry");
assert.match(js, /component\.createAnimation\(options\)/, "The state layer must delegate Lottie creation");
assert.doesNotMatch(js, /\bpath\s*:/, "The runtime must not fetch animation JSON by path");
assert.doesNotMatch(js, /assets\/aime\/aime_.*\.json/, "The runtime must not know animation asset paths");
assert.doesNotMatch(css, /assets\/aime\/images\/aime_/, "CSS must not know AIMe PNG paths");
assert.match(css, /var\(--aime-fallback-image, none\)/, "CSS must consume the component-owned fallback");
assert.match(js, /const aimeStorage = \{/, "File previews must use storage-safe access");
assert.doesNotMatch(js, /(?<!window\.)localStorage\./, "Runtime must not use unguarded localStorage access");

const collapsedCss = css.match(/\.aime-fab\.is-collapsed \{[\s\S]*?\n\}/)?.[0] ?? "";
assert.match(collapsedCss, /width:\s*108px/, "Collapsed hit area must retain pet width");
assert.match(collapsedCss, /right:\s*calc\(var\(--canvas-inset\) - 8px\)/, "Collapsed pet must cover its transparent right edge");
assert.doesNotMatch(collapsedCss, /border-radius:\s*50%/, "Collapsed state must not become a circular icon");
assert.match(css, /\.aime-fab\.is-collapsed \.aime-pet-visual \{\s*display:\s*block;/, "Peek pet must remain visible");
assert.match(css, /background-position:\s*7% 50%/, "Peek fallback must use the Lottie-aligned anchor");
assert.match(css, /background-size:\s*150% 150%/, "Peek fallback must match the Lottie loop scale");
assert.match(css, /\.aime-pet-visual\.is-lottie-ready \{\s*background-image:\s*none;/, "A loaded Lottie must replace its static fallback");

assert.deepEqual(
  peek.markers.map(({ cm, tm, dr }) => [cm, tm, dr]),
  [["peek_enter", 0, 15], ["peek_loop", 15, 60], ["peek_exit", 75, 15]],
  "Peek animation markers must remain stable"
);
assert.equal(peek.fr, 30, "Peek animation must use 30 FPS");
assert.deepEqual([peek.ip, peek.op], [0, 90], "Peek animation must span all marker ranges");
assert.match(js, /component\.segment\("peek_enter"\)/, "Runtime must play peek_enter by marker");
assert.match(js, /component\.segment\("peek_loop"\)/, "Runtime must play peek_loop by marker");
assert.doesNotMatch(js, /component\.segment\("peek_exit"\)/, "Expanding must replace peek directly without an exit segment");
assert.doesNotMatch(js, /playSegments\(\s*\[/, "Runtime must not hardcode segment frames");
assert.match(js, /aimeFab\.classList\.remove\("is-transitioning"\);\s*playAimeState\("idle"\);/, "Expanding must mount idle immediately");

console.log("AIMe components: four self-contained states, embedded images, markers and file-safe runtime passed");
