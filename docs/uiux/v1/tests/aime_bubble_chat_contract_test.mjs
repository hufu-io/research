import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const baseCss = fs.readFileSync(path.join(root, "base.css"), "utf8");
const css = fs.readFileSync(path.join(root, "ui.css"), "utf8");
const js = fs.readFileSync(path.join(root, "ui.js"), "utf8");

const fab = html.match(/<div class="aime-fab is-collapsed"[\s\S]*?<\/div>\s*<nav class="bottom-nav/)?.[0] ?? "";
const panel = html.match(/<section class="aime-panel canvas-fixed" data-modal="aime"[\s\S]*?<\/section>/)?.[0] ?? "";
const pointerDown = js.match(/aimeFab\.addEventListener\("pointerdown", \(event\) => \{[\s\S]*?\n  \}\);/)?.[0] ?? "";

assert.match(fab, /<button class="aime-fab-bubble"[^>]*data-action="open-aime"[^>]*data-aime-bubble[^>]*aria-label="打开 Aime 对话"/, "气泡必须是独立且可访问的打开入口");
assert.match(fab, /<button class="aime-pet-trigger"/, "宠物必须保留独立交互入口");
assert.doesNotMatch(fab, /<button class="aime-fab is-collapsed"/, "气泡不得继续嵌套在宠物父按钮中");

assert.match(panel, /role="dialog" aria-modal="true" aria-labelledby="aime-title" hidden/, "Aime 面板必须使用隐藏的模态对话语义");
assert.match(panel, /data-action="toggle-aime-full"[^>]*data-aime-expand/, "面板必须提供完整对话展开入口");
assert.match(panel, /data-action="minimize-aime"/, "面板必须提供最小化入口");
assert.match(panel, /data-aime-context/, "面板必须显示当前页面上下文");
assert.equal((panel.match(/data-aime-prompt=/g) || []).length, 3, "面板必须提供三条推荐问题");
assert.match(panel, /data-aime-form/, "面板必须提供聊天输入表单");

assert.match(pointerDown, /if \(event\.target\.closest\?\.\("\[data-aime-bubble\]"\)\) return;/, "气泡 pointer 事件必须在宠物状态机入口处被排除");
assert.ok(pointerDown.indexOf("[data-aime-bubble]") < pointerDown.indexOf("aimePointerId = event.pointerId"), "气泡排除必须发生在宠物捕获 pointer 之前");
assert.match(js, /function openAimePanel\(trigger\)/, "必须实现气泡专用的面板打开函数");
assert.match(js, /setAimePanelExpanded\(false\);\s*return openModal\("aime", trigger\);/, "气泡每次打开都必须从半屏状态开始");
assert.match(js, /if \(action === "open-aime"\) return openAimePanel\(actionTarget\);/, "气泡 action 必须只打开 Aime 面板");
assert.match(js, /if \(action === "toggle-aime-full"\)/, "必须实现半屏与完整对话切换");
assert.match(js, /if \(action === "minimize-aime"\) return closeModal\(\);/, "最小化必须复用弹层关闭与焦点恢复流程");
assert.match(js, /function answerAime\(question\)/, "必须实现本地原型回答");
assert.match(js, /document\.querySelector\("\[data-aime-form\]"\)\?\.addEventListener\("submit"/, "聊天输入必须处理提交事件");
assert.match(js, /const value = input\.value\.trim\(\);\s*if \(!value\) return;/, "空白问题不得生成消息");

assert.match(css, /\.aime-fab-bubble \{[\s\S]*?min-height:\s*44px;/, "气泡触控高度必须至少为 44px");
assert.match(css, /\.aime-pet-trigger \{[\s\S]*?width:\s*108px;[\s\S]*?height:\s*108px;/, "宠物独立入口必须保持原有命中尺寸");
assert.match(css, /\.aime-panel \{[\s\S]*?height:\s*min\(62dvh, 560px\);[\s\S]*?border-radius:\s*16px 16px 0 0;/, "Aime 初始面板必须保持半屏底部弹窗形态");
assert.match(css, /\.aime-panel\.is-full \{[\s\S]*?height:\s*100dvh;[\s\S]*?max-height:\s*100dvh;/, "完整对话状态必须占满画布高度");
assert.match(baseCss, /\.aime-input \{[\s\S]*?calc\(10px \+ var\(--safe-bottom\)\)/, "对话输入区必须避让底部安全区");

console.log("AIMe bubble: isolated trigger, half-sheet chat and full-view contract passed");
