# Hufu Wallet UI/UX v1

独立高保真 HTML 设计稿，设计基准为 `390 × 844`，遵循 [`.ui-design/.html-ui-design`](../../../.ui-design/.html-ui-design) 的 `mobile` 模式和项目级 [`DESIGN.md`](../../../.ui-design/DESIGN.md)。

本版本的字体、品牌图片、币种图标和 Aime 动效统一放在当前目录的 `assets/` 中；移动画布、滚动容器、底部导航和弹层等基础结构复用交互原型的画布样式，再由 `ui.css` 覆盖 UI/UX v1 的独立视觉。

## 与原型的关系

- 原型负责功能说明、页面关系、状态、规则和交互结果。
- UI/UX 继承原型的功能目标与安全约束，但重新设计信息层级、页面布局和视觉表现。
- UI/UX 不复制原型的模块顺序和页面排版。

## 当前页面

- 首页：钱包上下文、资产概览、快捷操作、资产洞察、生态精选和持仓行情。
- 社交：钱包身份、用户搜索、在线联系人、私聊/群聊筛选、会话状态和安全说明。
- 市场：FLON 核心行情、周期切换、市场统计和行情列表。
- 发现：最近访问、紧凑公链筛选、横向分类筛选和双列错落 DApp 列表。
- 我的：Profile、当前钱包、资产摘要、安全、钱包及 DApp 管理、Aime 设置。

社交首页不展示通用“最近访问 DApp”。聊天中收到的 DApp 只作为会话消息类型，点击后进入独立安全确认流程。

## 预览

直接双击 `index.html` 即可预览，AIMe 动画组件使用内嵌高清图片图层、矢量眼睑关键帧和独立 PNG fallback，不依赖 HTTP、XHR 或 CDN。也可以从仓库根目录启动本地 HTTP 服务后访问 `docs/uiux/v1/`。页面使用与交互原型一致的单一居中移动画布，不再使用“左侧设计说明 + 右侧设备模型”的桌面展示布局；通过底部导航切换页面。

发现页把 DApp 搜索入口放在 sticky Header 内；最近访问位于内容顶部，公链与分类组成吸顶双层筛选。公链不显示“全部”，分类默认选中接口原文“全部”；全部分类下卡片隐藏 Tag，选择具体分类后显示对应 Tag。

## AIMe 悬浮宠物

- `assets/aime/aime_idle.json`：高清默认呼吸和矢量眼睑眨眼。
- `assets/aime/aime_thinking.json`：高清思考动作和矢量眼睑眨眼。
- `assets/aime/aime_greeting.json`：高清问候动作和矢量眼睑眨眼，播放一次后回到 idle。
- `assets/aime/aime_peek.json`：高清右贴边姿态和矢量眼睑眨眼，包含 `peek_enter`、`peek_loop`、`peek_exit` 三段 marker；UI 仅负责状态切换。
- `assets/aime/components/`：由每组 JSON + PNG 生成的自包含运行时组件，页面状态只选择组件，不直接管理资源路径或帧区间。
- `scripts/build_aime_vector_sources.py`：使用 512×512 原始母版生成高清 Lottie 图片图层、整体关键帧和矢量眼睑，禁止低分辨率量化与色块化。
- `scripts/build_aime_components.mjs`：把每组 JSON 的高清图片图层内联进 `animationData`，同时输出独立 `fallbackImage`；使用 `--check` 可验证生成产物是否最新。
- 气泡由 HTML/CSS 独立绘制，不包含在 Lottie 内；展开后点击“问问我吧”会打开半屏 Aime 对话面板，用户可在面板内展开完整对话，宠物自身点击继续走独立交互。
- AIMe 每次进入原型默认以右贴边姿态显示，点击宠物可展开；拖拽或长按可再次贴边。只有“我的 → Aime 智能助手”设置开关可真正隐藏宠物，并保存用户的主动选择。
- 每个组件同时封装高清 `animationData`、独立 PNG `fallbackImage`、循环配置和 marker；JSON 首次渲染成功后隐藏兜底，Lottie 缺失、创建失败或 `data_failed` 时只显示 PNG。
- 宠物可在画布与底部导航之间自由拖动；未越过右侧最大边界时松手会自动靠近右边并保持展开，越界松手后贴住右边并收起；长按同样右贴边收起，贴边后点击即可展开。
- 贴边状态禁止回退成圆形 AI 图标：`.aime-pet-visual` 必须保持显示，气泡与箭头隐藏，并播放 `aime_peek.json`。
- Lottie Web 已放在 `vendor/lottie.min.js`，本地预览不依赖 CDN。
- 可运行 `node tests/aime_contract_test.mjs` 检查一组 JSON + PNG、512px 高清内联图层、独立 fallback、眨眼关键帧、故障注入、peek marker 和分段播放协议；运行 `node tests/aime_bubble_chat_contract_test.mjs` 检查气泡事件隔离与对话面板契约。
