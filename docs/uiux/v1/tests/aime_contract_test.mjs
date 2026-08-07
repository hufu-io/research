import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const read = (path) => readFile(resolve(root, path), "utf8");
const states = [
  { name: "idle", loop: true, duration: 90, componentVersion: 3 },
  { name: "thinking", loop: true, duration: 90, componentVersion: 3 },
  { name: "greeting", loop: false, duration: 30, componentVersion: 3 },
  { name: "peek", loop: false, duration: 90, componentVersion: 3 },
  { name: "peek2", loop: false, duration: 90, componentVersion: 3, animationImage: "aime_peek.png" }
];

function descendants(value, result = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => descendants(item, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  result.push(value);
  Object.values(value).forEach((item) => descendants(item, result));
  return result;
}

const [html, css, js, componentRuntime, generator, vectorGenerator] = await Promise.all([
  read("index.html"),
  read("ui.css"),
  read("ui.js"),
  read("components/aime_animation_component.js"),
  read("scripts/build_aime_components.mjs"),
  read("scripts/build_aime_vector_sources.py")
]);

assert.match(html, /class="aime-fab is-collapsed"/, "AIMe must start collapsed");
assert.match(html, /data-state="peek2"/, "Initial markup must select peek2");
assert.match(html, /aria-label="展开 Aime 智能助手"/, "Initial accessibility label must describe expansion");
assert.match(html, /ui\.css\?v=\d+/, "AIMe styles must use a cache version");
assert.match(html, /ui\.js\?v=\d+/, "Separated component integration must use a cache version");
assert.match(html, /components\/aime_animation_component\.js\?v=2/, "The separated component runtime must load first");

const sourceJsonNames = (await readdir(resolve(root, "assets/aime")))
  .filter((name) => /^aime_(idle|thinking|greeting|peek|peek2)\.json$/.test(name))
  .sort();
const fallbackNames = (await readdir(resolve(root, "assets/aime/images")))
  .filter((name) => /^aime_(idle|thinking|greeting|peek|peek2)\.png$/.test(name))
  .sort();
assert.deepEqual(sourceJsonNames, states.map(({ name }) => `aime_${name}.json`).sort(), "Each state must have exactly one JSON");
assert.deepEqual(fallbackNames, states.map(({ name }) => `aime_${name}.png`).sort(), "Each state must have exactly one fallback PNG");

for (const { name, loop, duration, componentVersion, animationImage = `aime_${name}.png` } of states) {
  assert.match(html, new RegExp(`assets/aime/components/aime_${name}\\.component\\.js\\?v=${componentVersion}`), `${name} component must be loaded`);
  const sourceAnimation = JSON.parse(await read(`assets/aime/aime_${name}.json`));
  const componentSource = await read(`assets/aime/components/aime_${name}.component.js`);
  const match = componentSource.match(/^window\.AimeAnimationComponents\.register\((.*)\);\n$/s);
  assert.ok(match, `${name} must be a registered component`);
  const component = JSON.parse(match[1]);
  assert.equal(component.name, name, `${name} component name must match its state`);
  assert.equal(component.loop, loop, `${name} loop behavior must stay encapsulated`);
  const expectedAnimation = structuredClone(sourceAnimation);
  const expectedImageAsset = expectedAnimation.assets.find(({ id }) => id === `aime_${name}_image`);
  const animationMaster = await readFile(resolve(root, "assets/aime/images", animationImage));
  const animationImageData = `data:image/png;base64,${animationMaster.toString("base64")}`;
  expectedImageAsset.u = "";
  expectedImageAsset.p = animationImageData;
  expectedImageAsset.e = 1;
  assert.deepEqual(component.animationData, expectedAnimation, `${name} component must only inline the paired HD image`);
  assert.equal(component.animationData.fr, 30, `${name} must run at 30 FPS`);
  assert.equal(component.animationData.op, duration, `${name} duration must match the blink timeline`);
  assert.ok(component.fallbackImage.startsWith("data:image/png;base64,"), `${name} must expose one independent fallback PNG`);
  const sourceImage = await readFile(resolve(root, "assets/aime/images", `aime_${name}.png`));
  assert.equal(component.fallbackImage, `data:image/png;base64,${sourceImage.toString("base64")}`, `${name} fallback must match its paired PNG`);
  const sourceNodes = descendants(sourceAnimation);
  const nodes = descendants(component.animationData);
  assert.equal(sourceNodes.filter(({ ty }) => ty === 2).length, 1, `${name} source JSON must contain one HD image layer`);
  const sourceAsset = sourceAnimation.assets.find(({ id }) => id === `aime_${name}_image`);
  assert.deepEqual([sourceAsset.w, sourceAsset.h, sourceAsset.u, sourceAsset.p, sourceAsset.e], [512, 512, "images/", animationImage, 0], `${name} source JSON must reference the 512px animation master`);
  const componentAsset = component.animationData.assets.find(({ id }) => id === `aime_${name}_image`);
  assert.deepEqual([componentAsset.w, componentAsset.h, componentAsset.u, componentAsset.e], [512, 512, "", 1], `${name} component must inline the HD image asset`);
  assert.equal(componentAsset.p, animationImageData, `${name} animation must inline its lossless motion master`);
  assert.ok(nodes.some(({ ty, nm }) => ty === 2 && nm?.includes("HD Artwork")), `${name} must contain HD artwork`);
  const eyelids = nodes.find(({ ty, nm }) => ty === 4 && nm?.includes("Vector Eyelids"));
  assert.ok(eyelids, `${name} must contain a dedicated vector eyelid layer`);
  assert.equal(eyelids.ks.o.a, 1, `${name} eyelids must be animated`);
  const opacityValues = eyelids.ks.o.k.flatMap(({ s }) => s);
  assert.ok(opacityValues.includes(0) && opacityValues.includes(100), `${name} eyelids must open and close`);
}

const peek = JSON.parse(await read("assets/aime/aime_peek.json"));
assert.deepEqual(
  peek.markers.map(({ cm, tm, dr }) => [cm, tm, dr]),
  [["peek_enter", 0, 15], ["peek_loop", 15, 60], ["peek_exit", 75, 15]],
  "Peek animation markers must remain stable"
);
const peek2 = JSON.parse(await read("assets/aime/aime_peek2.json"));
assert.deepEqual(
  peek2.markers.map(({ cm, tm, dr }) => [cm, tm, dr]),
  [["peek_enter", 0, 15], ["peek_loop", 15, 60], ["peek_exit", 75, 15]],
  "Peek2 animation markers must remain stable"
);
const peek2Frame = peek2.layers.find(({ nm }) => nm === "AIMe peek2 Static Wooden Doorframe");
const peek2Pet = peek2.layers.find(({ nm }) => nm === "AIMe peek2 HD Character");
assert.ok(peek2Frame, "Peek2 must contain a dedicated wooden doorframe layer");
assert.deepEqual([peek2Frame.ks.p.a, peek2Frame.ks.s.a, peek2Frame.ks.r.a], [0, 0, 0], "Peek2 doorframe transforms must stay static");
assert.ok(peek2Pet.ks.p.a && peek2Pet.ks.s.a && peek2Pet.ks.r.a, "Peek2 pet transforms must remain animated independently");
const peek2Positions = new Map(peek2Pet.ks.p.k.map(({ t, s }) => [t, s]));
const peek2Scales = new Map(peek2Pet.ks.s.k.map(({ t, s }) => [t, s]));
assert.deepEqual(peek2Positions.get(15), [378, 256], "Peek2 pet must sit deeper behind the right doorframe");
assert.deepEqual(peek2Positions.get(45), [376, 254], "Peek2 breathing must keep the paw aligned with the doorframe");
assert.deepEqual(peek2Scales.get(15), [132, 132], "Peek2 head must use the reduced base scale");
assert.deepEqual(peek2Scales.get(45), [135, 135], "Peek2 breathing must stay within the reduced scale range");
const peekArtwork = peek.layers.find(({ nm }) => nm === "AIMe peek HD Character");
const peekPositions = new Map(peekArtwork.ks.p.k.map(({ t, s }) => [t, s]));
const peekScales = new Map(peekArtwork.ks.s.k.map(({ t, s }) => [t, s]));
assert.deepEqual(peekPositions.get(15), [366, 256], "Peek loop must enter at the balanced right-edge position");
assert.deepEqual(peekPositions.get(45), [363, 254], "Peek loop must keep the face and paw inside the hit area");
assert.deepEqual(peekPositions.get(75), [366, 256], "Peek loop must leave from the balanced right-edge position");
assert.deepEqual(peekScales.get(15), [150, 150], "Peek head must use the coordinated base scale");
assert.deepEqual(peekScales.get(45), [153, 153], "Peek breathing must stay within the coordinated scale range");

assert.match(generator, /imageAsset\.p = animationImageData/, "The component generator must inline the motion image into animationData");
assert.match(generator, /name === "peek2" \? "aime_peek\.png"/, "Peek2 must keep its motion image separate from the framed fallback");
assert.match(generator, /fallbackImage/, "The component generator must emit a separate fallback field");
assert.match(vectorGenerator, /Vector Eyelids/, "The vector source generator must create eyelid layers");
assert.doesNotMatch(vectorGenerator, /resize\(\(128, 128\)\)|quantize\(/, "The source generator must not downsample or quantize the character");
assert.match(componentRuntime, /constructor\(\{ name, animationData, fallbackImage, loop = false \}\)/, "The component API must pair JSON and fallback explicitly");
assert.match(componentRuntime, /animationData:\s*JSON\.parse\(JSON\.stringify\(this\.animationData\)\)/, "Each mount must clone its animation data");
assert.match(componentRuntime, /container\.style\.setProperty\("--aime-fallback-image"/, "Each component must own its fallback image");
assert.match(componentRuntime, /animation\.addEventListener\("DOMLoaded", showAnimation\)/, "A successful HD render must hide fallback");
assert.match(componentRuntime, /animation\.addEventListener\("data_failed", showFallback\)/, "A failed vector render must restore fallback");
assert.doesNotMatch(componentRuntime, /animationData\.assets\?\.find/, "Fallback must not be inferred from animationData");
assert.match(js, /const aimeComponents = window\.AimeAnimationComponents;/, "The state layer must consume the component registry");
assert.match(js, /aimeComponents\.get\("peek2"\)/, "Collapsed state must mount the framed peek2 component");
assert.match(js, /return component\.createAnimation\(options\);/, "The state layer must delegate animation and fallback handling");
assert.doesNotMatch(js, /applyFallback|fallbackImage|data_failed|loaded_images/, "The state layer must not manage PNG fallback");
assert.doesNotMatch(js, /\bpath\s*:/, "The runtime must not fetch animation JSON by path");
assert.doesNotMatch(css, /assets\/aime\/images\/aime_/, "CSS must not know AIMe PNG paths");
assert.match(css, /var\(--aime-fallback-image, none\)/, "CSS must consume the component-owned fallback");
assert.match(js, /const aimeStorage = \{/, "File previews must use storage-safe access");
assert.doesNotMatch(js, /(?<!window\.)localStorage\./, "Runtime must not use unguarded localStorage access");

const collapsedCss = css.match(/\.aime-fab\.is-collapsed \{[\s\S]*?\n\}/)?.[0] ?? "";
assert.match(collapsedCss, /width:\s*108px/, "Collapsed hit area must retain pet width");
assert.match(collapsedCss, /right:\s*var\(--canvas-inset\)/, "Collapsed pet must align with the canvas right edge without clipping");
assert.match(css, /\.aime-fab:not\(\.is-collapsed\) \.aime-pet-visual \{\s*transform:\s*translateX\(22px\);/, "Expanded pet must sit close to the canvas right edge");
assert.match(css, /\.aime-fab:not\(\.is-collapsed\) \.aime-fab-bubble \{\s*transform:\s*translate\(18px, -18px\);/, "Expanded bubble must keep a clear gap above the three-circle trail");
assert.match(css, /\.aime-fab:not\(\.is-collapsed\) \.aime-fab-arrow \{\s*transform:\s*translate\(32px, -14px\) scaleX\(-1\);/, "Expanded mirrored bubble trail must stay fully visible between the bubble and head");
assert.match(css, /\.aime-fab-arrow \{[\s\S]*?z-index:\s*2;/, "All three bubble circles must render above the pet artwork");
assert.match(css, /\.aime-pet-visual\.is-lottie-ready \{\s*background-image:\s*none;/, "A successful JSON animation must hide fallback");
assert.match(js, /component\.segment\("peek_enter"\)/, "Runtime must play peek_enter by marker");
assert.match(js, /component\.segment\("peek_loop"\)/, "Runtime must play peek_loop by marker");
assert.doesNotMatch(js, /component\.segment\("peek_exit"\)/, "Expanding must replace peek directly without an exit segment");
assert.match(js, /aimeFab\.classList\.remove\("is-transitioning"\);\s*playAimeState\("idle"\);/, "Expanding must mount idle immediately");
assert.match(js, /window\.setTimeout\(\(\) => \{\s*if \(!aimeDragging && !aimeCollapsed\) playAimeState\("thinking"\);\s*\}, 160\)/, "Holding an expanded pet must mount thinking");
assert.match(js, /aimeLongPressTimer = window\.setTimeout\(\(\) => \{\s*aimeLongPressed = true;\s*setAimeCollapsed\(true\);\s*\}, 620\)/, "Long press must collapse to peek");

const runtimeContext = { window: {} };
vm.runInNewContext(componentRuntime, runtimeContext);
const registry = runtimeContext.window.AimeAnimationComponents;
const fallbackImage = "data:image/png;base64,AA==";
const runtimeComponent = registry.register({
  name: "test",
  loop: true,
  fallbackImage,
  animationData: { layers: [{ ty: 4 }], markers: [{ cm: "loop", tm: 2, dr: 5 }] }
});
const classes = new Set();
const styles = new Map();
const container = {
  classList: {
    add(name) { classes.add(name); },
    remove(name) { classes.delete(name); }
  },
  style: {
    setProperty(name, value) { styles.set(name, value); }
  }
};
assert.equal(runtimeComponent.createAnimation({ container }), null, "Missing Lottie must keep fallback active");
assert.equal(classes.has("is-lottie-ready"), false, "Fallback must remain visible when Lottie is missing");
assert.ok(styles.get("--aime-fallback-image").includes(fallbackImage), "Fallback must be applied before creation");

const listeners = new Map();
let destroyed = false;
runtimeContext.window.lottie = {
  loadAnimation() {
    return {
      addEventListener(name, listener) { listeners.set(name, listener); },
      destroy() { destroyed = true; }
    };
  }
};
runtimeComponent.createAnimation({ container });
listeners.get("DOMLoaded")();
assert.equal(classes.has("is-lottie-ready"), true, "DOMLoaded must reveal JSON animation");
listeners.get("data_failed")();
assert.equal(classes.has("is-lottie-ready"), false, "data_failed must restore fallback");
assert.equal(destroyed, true, "data_failed must remove the failed renderer");

runtimeContext.window.lottie.loadAnimation = () => { throw new Error("failure"); };
assert.equal(runtimeComponent.createAnimation({ container }), null, "Creation errors must return the fallback state");
assert.equal(classes.has("is-lottie-ready"), false, "Creation errors must keep fallback visible");
assert.deepEqual(Array.from(runtimeComponent.segment("loop")), [2, 7], "Marker ranges must stay component-owned");

console.log("AIMe: HD Lottie image layers, vector blinking, fallback and file-safe component contract passed");
