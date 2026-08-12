import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "ui.css"), "utf8");
const js = fs.readFileSync(path.join(root, "ui.js"), "utf8");
const design = fs.readFileSync(path.resolve(root, "../../../.ui-design/DESIGN.md"), "utf8");
const discover = html.match(/<!-- ============ 发现 ============ -->[\s\S]*?<!-- ============ 我的 ============ -->/)?.[0] || "";

assert.equal((discover.match(/data-discover-chain=/g) || []).length, 6, "发现页必须展示六条接口公链");
assert.doesNotMatch(discover, /data-discover-chain="all"|data-discover-chain[^>]*>全部</, "公链筛选不得提供全部");
assert.equal((discover.match(/data-discover-category=/g) || []).length, 3, "FLON 必须展示三个接口分类");
assert.match(discover, /data-discover-category="all">全部</, "全部分类必须保留接口中文原文");
assert.match(discover, /data-discover-category="dex">DEX</, "必须展示 DEX 分类");
assert.match(discover, /data-discover-category="utilities">日常工具</, "必须展示日常工具分类");
assert.equal((discover.match(/data-discover-card/g) || []).length, 4, "必须展示四条真实 DApp 样本");
assert.equal((discover.match(/class="dapp-type-tag" hidden/g) || []).length, 4, "全部分类下所有卡片 Tag 必须默认隐藏");
assert.equal((discover.match(/class="verified-label"/g) || []).length, 4, "每张卡片必须保留核验状态");

assert.match(css, /\.discover-appbar \{[\s\S]*?height:\s*108px;[\s\S]*?padding:\s*8px var\(--appbar-gutter\);/, "搜索栏外层必须映射 App 56px 高度");
assert.match(css, /#app-frame \{[\s\S]*?flex:\s*0 0 750px;[\s\S]*?width:\s*750px;/, "750px 内部画布不得被 Flex 压缩");
assert.match(css, /\.discover-filter-panel \.chain-chips \{[\s\S]*?height:\s*73px;[\s\S]*?padding:\s*2px var\(--page-gutter\);/, "公链栏必须映射 38px 高度和 1px 上下留白");
assert.match(css, /\.discover-filter-panel \.chain-chips button \{[\s\S]*?height:\s*69px;[\s\S]*?font-size:\s*21px;/, "公链按钮必须映射 36px 高度和 11px 字号");
assert.match(css, /\.discover-category-tabs \{[\s\S]*?gap:\s*4px;[\s\S]*?height:\s*85px;[\s\S]*?overflow-x:\s*auto;/, "分类栏必须紧凑横向滚动");
assert.match(css, /\.discover-category-tabs button \{[\s\S]*?font-size:\s*23px;/, "分类文字必须映射 12px 字号");
assert.match(css, /\.discover-grid \{[\s\S]*?column-count:\s*2;[\s\S]*?column-gap:\s*23px;/, "列表必须使用双列错落布局");
assert.match(css, /\.dapp-type-tag\[hidden\] \{\s*display:\s*none;/, "隐藏 Tag 不得占据卡片空间");

assert.match(js, /function selectDiscoverChain\(tab, moveFocus = false\)/, "必须实现公链选择");
assert.match(js, /function selectDiscoverCategory\(tab, moveFocus = false\)/, "必须实现分类选择");
assert.match(js, /function applyDiscoverFilter\(\)/, "必须实现链与分类组合筛选");
assert.match(js, /toggleAttribute\("hidden", discoverActiveCategory === "all"\)/, "全部分类必须动态隐藏 Tag");
assert.match(js, /selectDiscoverCategory\(discoverCategoryTabs\[0\]\)/, "切换公链必须回到全部分类");

for (const asset of [
  "assets/images/icon/FLON.png",
  "assets/images/icon/BNB.png",
  "assets/images/icon/STT.png",
  "assets/images/icon/fantom.png",
  "assets/images/icon/SOLANA.png",
  "assets/images/dapp/gmswap.png",
  "assets/images/dapp/fullbridge.png",
  "assets/images/dapp/fullon-explorer.jpg",
  "assets/images/dapp/fullswap.png"
]) {
  const file = path.join(root, asset);
  assert.ok(fs.existsSync(file), `缺少发现页资源 ${asset}`);
  assert.ok(fs.statSync(file).size > 1000, `发现页资源不可为空 ${asset}`);
}

assert.match(design, /默认选择 FLON 与“全部”/, "设计规范必须记录发现页默认筛选状态");
assert.match(design, /全部分类下双列错落卡片不显示右上角 Tag/, "设计规范必须记录 Tag 显隐规则");

console.log("Discover design contract checks passed");
