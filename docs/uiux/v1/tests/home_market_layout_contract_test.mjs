import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const [html, css] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "ui.css"), "utf8")
]);

const holdingSection = html.match(/<section class="holding-section"[\s\S]*?<\/section>/)?.[0] || "";

assert.equal(
  (holdingSection.match(/class="holding-market-card"/g) || []).length,
  3,
  "Home market must render exactly three coin cards"
);
assert.match(holdingSection, /data-symbol="FLON"/, "FLON card must remain available");
assert.match(holdingSection, /data-symbol="SING"/, "SING card must remain available");
assert.match(holdingSection, /data-symbol="BTC"/, "BTC card must remain available");
assert.equal(
  (holdingSection.match(/data-action="open-market-detail"/g) || []).length,
  3,
  "Every coin card must preserve the market-detail interaction"
);
assert.doesNotMatch(holdingSection, /holding-market-more/, "Home market must not render an outer more card");
assert.doesNotMatch(holdingSection, /aria-roledescription="轮播"|holding-carousel-hint/, "Static coin grid must not expose carousel semantics");

assert.match(css, /--page-gutter:\s*31px;/, "App page gutter must remain the shared 31px token");
assert.match(css, /\.page-content \{[\s\S]*?padding-right:\s*var\(--page-gutter\);[\s\S]*?padding-left:\s*var\(--page-gutter\);/, "Page content must consume the shared gutter on both sides");
assert.match(css, /\.holding-market \{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/, "Home market must use three equal grid columns");
assert.match(css, /\.holding-market \{[\s\S]*?padding:\s*8px 0 15px;/, "Home market must not add horizontal padding inside the app gutter");
assert.doesNotMatch(css.match(/\.holding-market \{[\s\S]*?\}/)?.[0] || "", /margin-right|overflow-x|scroll-snap|touch-action/, "Home market must not break the app gutter or scroll horizontally");
assert.doesNotMatch(css.match(/\.holding-market-card \{[\s\S]*?\}/)?.[0] || "", /aspect-ratio|height:/, "Home market card height must follow its content");
assert.doesNotMatch(css, /\.holding-market-card\.holding-market-more/, "Removed more-card styles must not remain");

console.log("Home market: three compact auto-height cards, shared app gutter, and non-carousel layout contract passed");
