import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "ui.css"), "utf8");
const js = fs.readFileSync(path.join(root, "ui.js"), "utf8");

const socialSection = html.match(/<section class="page-view" data-view="social"[\s\S]*?<\/section>\s*<!-- ============ 市场/)[0];

assert.match(socialSection, /data-social-search-input/, "社交页必须提供会话搜索输入框");
assert.equal((socialSection.match(/data-social-filter=/g) || []).length, 3, "社交页必须提供三个会话分类");
assert.equal((socialSection.match(/data-chat-row/g) || []).length, 6, "社交页必须提供六条高保真会话样本");
assert.equal((socialSection.match(/class="chat-row is-pinned"/g) || []).length, 2, "必须明确展示两条置顶会话");
assert.match(socialSection, /data-chat-kind="friend"/, "必须包含好友会话");
assert.match(socialSection, /data-chat-kind="group"/, "必须包含群组会话");
assert.doesNotMatch(socialSection, /i-check-double|delivery-state|aria-label="已读"/, "会话列表不得展示双勾已读图标");
assert.doesNotMatch(socialSection, /<span class="chat-preview"><small><b>/, "消息摘要不得重复展示发送人名称");
assert.match(socialSection, /<small>\[图片\]<\/small>/, "图片消息摘要必须统一显示为 [图片]");
assert.match(socialSection, /aria-label="已置顶"/, "置顶状态必须具有可访问文本");
assert.match(socialSection, /data-social-chat-empty hidden/, "必须提供搜索空结果状态");

assert.match(css, /\.social-search \{[\s\S]*?min-height:\s*48px;/, "搜索框高度必须达到 48px");
assert.match(css, /\.social-filter-tabs button \{[\s\S]*?min-height:\s*44px;/, "分类触控目标必须达到 44px");
assert.match(css, /\.social-chat-list \.chat-row \{[\s\S]*?grid-template-columns:\s*52px minmax\(0, 1fr\);/, "会话行必须使用头像和弹性文本列");
assert.match(css, /\.social-chat-list \.chat-row::after \{[\s\S]*?left:\s*82px;/, "会话分割线必须从文本列开始");
assert.match(css, /text-overflow:\s*ellipsis;/, "长会话文案必须提供省略保护");

assert.match(js, /function applySocialChatFilter\(\)/, "必须实现搜索和分类过滤");
assert.match(js, /function selectSocialFilter\(tab, moveFocus = false\)/, "必须实现分类选择");
assert.match(js, /socialSearchInput\?\.addEventListener\("input", applySocialChatFilter\)/, "搜索输入必须实时过滤");
assert.match(js, /socialChatEmpty\.hidden = visibleCount > 0/, "过滤结果必须控制空状态");
assert.match(js, /\["ArrowLeft", "ArrowRight", "Home", "End"\]/, "分类必须支持键盘方向键");

console.log("Social chat list contract checks passed");
