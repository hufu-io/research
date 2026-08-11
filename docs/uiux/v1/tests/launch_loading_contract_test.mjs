import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "ui.css"), "utf8");
const script = fs.readFileSync(path.join(root, "ui.js"), "utf8");
const component = fs.readFileSync(path.join(root, "assets/loading/tiger_loading.component.js"), "utf8");
const prefix = "window.TigerLoadingAnimationData=";

assert(html.includes("data-launch-loading"));
assert(html.includes("data-launch-loading-animation"));
assert(html.indexOf("vendor/lottie.min.js") < html.indexOf("tiger_loading.component.js"));
assert(html.indexOf("tiger_loading.component.js") < html.indexOf("ui.js?v=50"));
assert(component.startsWith(prefix));
assert(component.endsWith(";\n"));
assert(!component.includes("fetch("));

const animation = JSON.parse(component.slice(prefix.length, -2));
assert.equal(animation.assets.length, 4);
assert(animation.assets.every((asset) => asset.e === 1 && asset.p.startsWith("data:image/png;base64,")));

assert(css.includes("right: var(--canvas-inset)"));
assert(css.includes("left: var(--canvas-inset)"));
assert(css.includes("transition: opacity 200ms ease"));
assert(script.includes("window.setTimeout(() =>"));
assert(script.includes("}, 1000);"));
assert(script.includes("launchLoadingAnimation?.destroy()"));
assert(script.includes("document.documentElement.dataset.launchState = \"ready\""));

console.log("Launch loading: embedded animation, 1s lifecycle and canvas-bound overlay contract passed");
