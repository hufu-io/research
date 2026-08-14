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
  { name: "peek2", loop: false, duration: 90, componentVersion: 4 }
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

for (const { name, loop, duration, componentVersion } of states) {
  assert.match(html, new RegExp(`assets/aime/components/aime_${name}\\.component\\.js\\?v=${componentVersion}`), `${name} component must be loaded`);
  const sourceAnimation = JSON.parse(await read(`assets/aime/aime_${name}.json`));
  const componentSource = await read(`assets/aime/components/aime_${name}.component.js`);
  const match = componentSource.match(/^window\.AimeAnimationComponents\.register\((.*)\);\n$/s);
  assert.ok(match, `${name} must be a registered component`);
  const component = JSON.parse(match[1]);
  assert.equal(component.name, name, `${name} component name must match its state`);
  assert.equal(component.loop, loop, `${name} loop behavior must stay encapsulated`);
  const expectedAnimation = structuredClone(sourceAnimation);
  const expectedImageAssets = expectedAnimation.assets.filter(({ p }) => typeof p === "string" && !p.startsWith("data:"));
  await Promise.all(expectedImageAssets.map(async (asset) => {
    const animationMaster = await readFile(resolve(root, "assets/aime", asset.u || "", asset.p));
    asset.u = "";
    asset.p = `data:image/png;base64,${animationMaster.toString("base64")}`;
    asset.e = 1;
  }));
  assert.deepEqual(component.animationData, expectedAnimation, `${name} component must only inline the paired HD image`);
  assert.equal(component.animationData.fr, 30, `${name} must run at 30 FPS`);
  assert.equal(component.animationData.op, duration, `${name} duration must match the blink timeline`);
  assert.ok(component.fallbackImage.startsWith("data:image/png;base64,"), `${name} must expose one independent fallback PNG`);
  const sourceImage = await readFile(resolve(root, "assets/aime/images", `aime_${name}.png`));
  assert.equal(component.fallbackImage, `data:image/png;base64,${sourceImage.toString("base64")}`, `${name} fallback must match its paired PNG`);
  const sourceNodes = descendants(sourceAnimation);
  const nodes = descendants(component.animationData);
  if (name === "peek2") {
    const sourceAssets = sourceAnimation.assets.filter(({ p }) => typeof p === "string");
    assert.deepEqual(
      sourceAssets.map(({ id, u, p, e }) => [id, u, p, e]),
      [
        ["aime_peek_hd_image", "images/", "aime_peek2.png", 0],
        ["aime_peek_half_image", "images/", "aime_peek2_half.png", 0],
        ["aime_peek_closed_image", "images/", "aime_peek2_closed.png", 0],
        ["aime_peek_alpha_matte", "images/", "aime_peek.png", 0]
      ],
      "peek2 source JSON must reference only the canonical open, blink, and alpha assets"
    );
    assert.ok(sourceNodes.filter(({ ty }) => ty === 2).length >= 8, "peek2 must use complete raster frames for the body and hand");
    assert.ok(nodes.some(({ nm }) => nm === "AIMe Peek HD Body Half Closed"), "peek2 must contain a complete half-closed body frame");
    assert.ok(nodes.some(({ nm }) => nm === "AIMe Peek HD Body Closed"), "peek2 must contain a complete closed body frame");
    assert.ok(nodes.every(({ nm }) => !nm?.includes("Eye Socket")), "peek2 must not restore the removed eye patch layers");
  } else {
    assert.equal(sourceNodes.filter(({ ty }) => ty === 2).length, 1, `${name} source JSON must contain one HD image layer`);
    const sourceAsset = sourceAnimation.assets.find(({ id }) => id === `aime_${name}_image`);
    assert.deepEqual([sourceAsset.w, sourceAsset.h, sourceAsset.u, sourceAsset.p, sourceAsset.e], [512, 512, "images/", `aime_${name}.png`, 0], `${name} source JSON must reference the 512px animation master`);
    const componentAsset = component.animationData.assets.find(({ id }) => id === `aime_${name}_image`);
    assert.deepEqual([componentAsset.w, componentAsset.h, componentAsset.u, componentAsset.e], [512, 512, "", 1], `${name} component must inline the HD image asset`);
    assert.ok(nodes.some(({ ty, nm }) => ty === 2 && nm?.includes("HD Artwork")), `${name} must contain HD artwork`);
    const eyelids = nodes.find(({ ty, nm }) => ty === 4 && nm?.includes("Vector Eyelids"));
    assert.ok(eyelids, `${name} must contain a dedicated vector eyelid layer`);
    assert.equal(eyelids.ks.o.a, 1, `${name} eyelids must be animated`);
    const opacityValues = eyelids.ks.o.k.flatMap(({ s }) => s);
    assert.ok(opacityValues.includes(0) && opacityValues.includes(100), `${name} eyelids must open and close`);
  }
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
  [["peek_enter", 0, 25], ["peek_loop", 25, 50], ["peek_exit", 75, 15]],
  "Peek2 animation markers must remain stable"
);
const peek2Frame = peek2.layers.find(({ nm }) => nm === "AIMe Static Vector Doorframe");
const peek2Hand = peek2.layers.find(({ nm }) => nm === "AIMe Peek HD Hand");
const peek2Bodies = peek2.layers.filter(({ nm }) => nm?.startsWith("AIMe Peek HD Body"));
assert.ok(peek2Frame, "Peek2 must contain a dedicated wooden doorframe layer");
assert.deepEqual([peek2Frame.ks.p.a, peek2Frame.ks.s.a, peek2Frame.ks.r.a], [0, 0, 0], "Peek2 doorframe transforms must stay static");
assert.ok(peek2Hand?.ks.p.a && peek2Hand?.ks.s.a, "Peek2 hand must animate independently before the head appears");
assert.equal(peek2Bodies.length, 3, "Peek2 must switch complete open, half-closed, and closed body frames");
const peek2HandPositions = new Map(peek2Hand.ks.p.k.map(({ t, s }) => [t, s]));
assert.deepEqual(peek2HandPositions.get(0), [1000, 586, 0], "Peek2 hand must begin outside the right edge");
assert.deepEqual(peek2HandPositions.get(10), [627, 586, 0], "Peek2 hand must reach the doorframe before the head enters");
const peekArtwork = peek.layers.find(({ nm }) => nm === "AIMe peek HD Character");
const peekPositions = new Map(peekArtwork.ks.p.k.map(({ t, s }) => [t, s]));
const peekScales = new Map(peekArtwork.ks.s.k.map(({ t, s }) => [t, s]));
assert.deepEqual(peekPositions.get(15), [366, 256], "Peek loop must enter at the balanced right-edge position");
assert.deepEqual(peekPositions.get(45), [363, 254], "Peek loop must keep the face and paw inside the hit area");
assert.deepEqual(peekPositions.get(75), [366, 256], "Peek loop must leave from the balanced right-edge position");
assert.deepEqual(peekScales.get(15), [150, 150], "Peek head must use the coordinated base scale");
assert.deepEqual(peekScales.get(45), [153, 153], "Peek breathing must stay within the coordinated scale range");

assert.match(generator, /Promise\.all\(imageAssets\.map/, "The component generator must inline every animation image asset");
assert.match(generator, /resolve\(sourceDir, imageAsset\.u \|\| "", imageAsset\.p\)/, "The component generator must resolve each canonical source image");
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
assert.match(collapsedCss, /width:\s*var\(--aime-collapsed-width\)/, "Collapsed hit area must use the stable collapsed width token");
assert.match(collapsedCss, /right:\s*var\(--canvas-inset\)/, "Collapsed pet must align with the canvas right edge without clipping");
assert.match(css, /\.aime-fab:not\(\.is-collapsed\) \.aime-pet-visual \{\s*transform:\s*translateX\(42px\);/, "Expanded pet must sit close to the canvas right edge");
assert.match(css, /\.aime-fab:not\(\.is-collapsed\) \.aime-fab-bubble \{\s*transform:\s*translate\(35px, -35px\);/, "Expanded bubble must keep a clear gap above the three-circle trail");
assert.match(css, /\.aime-fab:not\(\.is-collapsed\) \.aime-fab-arrow \{\s*transform:\s*translate\(62px, -27px\) scaleX\(-1\);/, "Expanded mirrored bubble trail must stay fully visible between the bubble and head");
assert.match(css, /\.aime-fab-arrow \{[\s\S]*?z-index:\s*2;/, "All three bubble circles must render above the pet artwork");
assert.match(css, /\.aime-pet-visual\.is-lottie-ready \{\s*background-image:\s*none;/, "A successful JSON animation must hide fallback");
assert.match(js, /component\.segment\("peek_enter"\)/, "Runtime must play peek_enter by marker");
assert.match(js, /component\.segment\("peek_loop"\)/, "Runtime must play peek_loop by marker");
assert.doesNotMatch(js, /component\.segment\("peek_exit"\)/, "Expanding must replace peek directly without an exit segment");
assert.match(js, /aimeFab\.classList\.remove\("is-transitioning"\);\s*playAimeState\("idle"\);/, "Expanding must mount idle immediately");
assert.match(js, /window\.setTimeout\(\(\) => \{\s*if \(!aimeDragging && !aimeCollapsed\) playAimeState\("thinking"\);\s*\}, 160\)/, "Holding an expanded pet must mount thinking");
assert.match(js, /aimeLongPressTimer = window\.setTimeout\(\(\) => \{\s*aimeLongPressed = true;\s*dockAimeRight\(\);\s*\}, 620\)/, "Long press must dock and collapse to the right edge");
assert.match(js, /const distanceY = event\.clientY - aimePointerStartY;/, "Dragging must track vertical pointer movement");
assert.match(js, /const rawLeft = aimeDragOriginLeft \+ distanceX;\s*aimeRightBoundaryExceeded = rawLeft > getAimeDragBounds\(\)\.maxLeft;/, "Dragging must retain whether the raw position exceeds the right boundary");
assert.match(js, /setAimePosition\(rawLeft, aimeDragOriginTop \+ distanceY\);/, "Dragging must update both visible coordinates after boundary intent is captured");
assert.match(js, /navigationTop - fabRect\.height - 23/, "Dragging must stay above the bottom navigation");
assert.match(css, /--aime-expanded-width:\s*254px;[\s\S]*?--aime-collapsed-width:\s*208px;/, "AIMe must expose stable target widths for one-step right alignment");
assert.match(js, /const targetWidth = getAimeTargetWidth\(aimeCollapsed\);\s*const targetLeft = aimeCollapsed \? frameRect\.right - targetWidth : frameRect\.right - targetWidth - 23;[\s\S]*?renderAimePosition\(Math\.max\(bounds\.minLeft, targetLeft\), top\);/, "AIMe must calculate stable collapsed and expanded right-side targets without a second correction");
assert.match(js, /function dockAimeRight\(\) \{\s*aimeDockedRight = true;\s*setAimeCollapsed\(true\);\s*snapAimeToRightEdge\(\);/, "Docking must enter the collapsed state before calculating its final right-edge position");
assert.match(js, /function settleAimeRight\(\) \{\s*aimeDockedRight = true;\s*setAimeCollapsed\(false\);\s*snapAimeToRightEdge\(\);/, "A normal drag release must remain expanded and settle near the right edge");
assert.match(js, /aimeFab\.addEventListener\("transitionend", \(event\) => \{\s*if \(event\.target !== aimeFab \|\| event\.propertyName !== "width" \|\| !aimePositioned \|\| !aimeDockedRight\) return;\s*snapAimeToRightEdge\(\);/, "AIMe must recalibrate the right edge after its collapse width transition");
assert.doesNotMatch(js, /bounds\.minLeft\s*:\s*bounds\.maxLeft|is-snapped-left|aimeSnappedSide/, "AIMe must not select or retain a left edge");
const pointerMoveHandler = js.match(/aimeFab\.addEventListener\("pointermove",[\s\S]*?\n  \}\);/)?.[0] ?? "";
assert.doesNotMatch(pointerMoveHandler, /snapAimeToRightEdge/, "Dragging must stay free until the pointer is released");
assert.match(js, /const shouldDockRight = aimeRightBoundaryExceeded;[\s\S]*?if \(wasDragging\) \{\s*if \(shouldDockRight\) dockAimeRight\(\);\s*else settleAimeRight\(\);\s*return;/, "Pointer release must collapse after overflow and otherwise settle expanded near the right edge");
assert.match(js, /if \(shouldDockRight\) dockAimeRight\(\);\s*else settleAimeRight\(\);/, "Pointer cancellation must also resolve to the right-side collapsed or expanded state");
assert.match(css, /\.aime-fab\.is-dragging \{[\s\S]*?transition:\s*none;/, "Dragging must remain pointer-synchronous");
assert.doesNotMatch(css, /is-snapped-left/, "Styles must not expose a left-edge state");

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

console.log("AIMe: HD Lottie image layers, complete blink frames, fallback and file-safe component contract passed");
