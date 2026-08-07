import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const [html, css, js] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "ui.css"), "utf8"),
  readFile(resolve(root, "ui.js"), "utf8")
]);

assert.match(html, /role="tablist" aria-label="市场页面"/, "Market and news must use an independent primary tablist");
assert.match(html, /data-market-view-tab="quotes"/, "Market primary tab must exist");
assert.match(html, /data-market-view-tab="news"/, "News primary tab must exist");
assert.match(html, /id="market-quotes-panel"[\s\S]*?data-market-view-panel="quotes"/, "Quotes must own an independent tab panel");
assert.match(html, /id="market-news-panel"[\s\S]*?data-market-view-panel="news" hidden/, "News must own an initially hidden tab panel");
assert.match(html, /aria-controls="market-quotes-panel"/, "Market tab must control the quotes panel");
assert.match(html, /aria-controls="market-news-panel"/, "News tab must control the news panel");
assert.match(html, /data-market-open-news/, "Home news entry must deep-open the independent news page");

const quotesPanel = html.match(/<div id="market-quotes-panel"[\s\S]*?<\/div>\s*<section id="market-news-panel"/)?.[0] || "";
const newsPanel = html.match(/<section id="market-news-panel"[\s\S]*?<\/section>\s*<\/div>\s*<\/section>\s*\n\s*<!-- ============ 发现/)?.[0] || "";
assert.match(quotesPanel, /data-market-category="self"/, "Existing self category must stay in the market panel");
assert.match(quotesPanel, /data-market-category="fullon"/, "Existing FullOn category must stay in the market panel");
assert.match(quotesPanel, /data-market-category="mainstream"/, "Existing mainstream category must stay in the market panel");
assert.equal((quotesPanel.match(/class="market-row-shell"/g) || []).length, 4, "All existing market rows must remain in the market panel");
assert.match(quotesPanel, /<button class="market-search-entry"[^>]*data-action="open-market-search"/, "Market search entry must be a button inside the quotes panel");
assert.doesNotMatch(quotesPanel.match(/<button class="market-search-entry"[\s\S]*?<\/button>/)?.[0] || "", /<input/, "Default market search entry must not be an input");
assert.doesNotMatch(newsPanel, /data-market-category/, "News must not join the market category tabs");
assert.doesNotMatch(newsPanel, /data-market-search/, "News must not own market search");
assert.ok((newsPanel.match(/class="market-news-item/g) || []).length >= 5, "News page must provide a complete independent feed");
assert.match(newsPanel, /class="market-news-datebar"/, "News page must provide a compact date bar");
assert.equal((newsPanel.match(/class="market-news-time"/g) || []).length, 5, "Every news item must expose a scan-friendly time column");
assert.equal((newsPanel.match(/class="market-news-node"/g) || []).length, 5, "Every news item must participate in the timeline");
assert.equal((newsPanel.match(/class="market-news-subtitle"/g) || []).length, 5, "Every news item must provide a preview subtitle");
assert.equal((newsPanel.match(/class="market-news-source"/g) || []).length, 5, "Every news item must retain source context");
assert.doesNotMatch(newsPanel, /is-important|market-news-badge|>重要</, "News feed must not expose the removed important status");
assert.doesNotMatch(newsPanel, /market-news-tags|market-news-footer/, "News feed must avoid tag clutter");

const marketHeader = html.match(/<header class="appbar market-appbar">[\s\S]*?<\/header>/)?.[0] || "";
assert.doesNotMatch(marketHeader, /market-search-trigger/, "Market header must not contain the search icon trigger");
assert.match(css, /\.market-search-entry \{[\s\S]*?min-height:\s*44px;/, "Search entry must meet the mobile touch target");
assert.match(css, /\.market-search-entry:focus-visible/, "Search entry must expose keyboard focus");
assert.match(css, /\.market-view-tabs button \{[\s\S]*?min-height:\s*44px;/, "Primary tabs must meet the mobile touch target");
assert.match(css, /\.market-view-tabs button:focus-visible/, "Primary tabs must expose keyboard focus");
assert.match(css, /\.market-news-item:focus-visible/, "News items must expose keyboard focus");
assert.match(css, /\.market-news-item \{[\s\S]*?grid-template-columns:\s*44px 12px minmax\(0, 1fr\);/, "News items must use a compact timeline grid");
assert.match(css, /\.market-news-item \{[\s\S]*?min-height:\s*88px;/, "News rows must stay compact while retaining a generous touch target");
assert.match(css, /\.market-news-subtitle \{[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/, "News subtitles must remain single-line previews");
assert.doesNotMatch(css, /\.market-news-item\.is-important|\.market-news-badge/, "Removed important status styles must not remain");
assert.match(css, /\.market-content > \.market-view-panel \{\s*margin-top:\s*0;/, "Primary panels must not shift the existing market layout");

assert.match(js, /function selectMarketView\(tab, moveFocus = false\)/, "Runtime must own primary page switching");
assert.match(js, /panel\.hidden = panel\.dataset\.marketViewPanel !== nextView/, "Only the selected primary panel may remain visible");
assert.match(js, /nextView === "news" && marketSearch && !marketSearch\.hidden\) closeMarketSearch\(false\)/, "Opening news must close market search without moving focus");
assert.match(js, /marketActiveView !== "quotes"/, "Search must reject activation outside the market page");
assert.match(js, /marketViewTab && \["ArrowLeft", "ArrowRight", "Home", "End"\]/, "Primary tabs must support standard keyboard navigation");
assert.match(js, /marketViewScroll\[marketActiveView\] = marketPage\.scrollTop/, "Market and news must preserve independent scroll positions");

console.log("Market news: compact timeline, market-only search, preserved quotes layout and accessible tab contract passed");
