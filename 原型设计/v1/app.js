(() => {
  const walletData = {
    日常钱包: {
      network: "FullOn",
      address: "flon8Q…p6K2",
      fullAddress: "flon8Q2R6n4D9m3Xp6K2",
      account: "dragonmaster",
      total: "$24,860.42",
      converted: "≈ 24,856.90 USDT",
      assets: [
        { symbol: "FLON", network: "FullOn Network", balance: "185,420.80", value: "$15,615.94", image: "assets/images/dapplogo/flon.png" },
        { symbol: "USDT", network: "FullOn Network", balance: "8,240.20", value: "$8,241.85", image: "assets/images/icon/USDT.png" },
        { symbol: "SING", network: "FullOn Network", balance: "51,160.00", value: "$1,002.73", letter: "S" }
      ],
      markets: [
        { symbol: "FLON", network: "FullOn Network", price: "$0.0842", change: "+8.24%", image: "assets/images/dapplogo/flon.png" },
        { symbol: "SING", network: "FullOn Network", price: "$0.0196", change: "−2.18%", letter: "S" },
        { symbol: "USDT", network: "FullOn Network", price: "$1.0002", change: "+0.02%", image: "assets/images/icon/USDT.png" }
      ]
    },
    储蓄钱包: {
      network: "Ethereum",
      address: "0x72A1…91E4",
      fullAddress: "0x72A1b4F9D6c91E4",
      account: "0x72A1",
      total: "$18,742.16",
      converted: "≈ 18,734.08 USDT",
      assets: [
        { symbol: "ETH", network: "Ethereum", balance: "2.8042", value: "$10,493.52", image: "assets/images/icon/ETH.png" },
        { symbol: "USDT", network: "Ethereum", balance: "8,240.20", value: "$8,241.85", image: "assets/images/icon/USDT.png" }
      ],
      markets: [
        { symbol: "ETH", network: "Ethereum", price: "$3,742.16", change: "−0.62%", image: "assets/images/icon/ETH.png" },
        { symbol: "BTC", network: "Bitcoin", price: "$116,842", change: "+1.46%", image: "assets/images/icon/BTC.png" },
        { symbol: "USDT", network: "Ethereum", price: "$1.0001", change: "+0.01%", image: "assets/images/icon/USDT.png" }
      ]
    },
    工作钱包: {
      network: "Solana",
      address: "7Nu3…mS2a",
      fullAddress: "7Nu3t5a9K8LmS2a",
      account: "work.sol",
      total: "$6,418.80",
      converted: "≈ 6,411.25 USDT",
      assets: [
        { symbol: "SOL", network: "Solana", balance: "31.42", value: "$5,918.80", image: "assets/images/icon/SOLANA.png" },
        { symbol: "USDT", network: "Solana", balance: "500.00", value: "$500.00", image: "assets/images/icon/USDT.png" }
      ],
      markets: [
        { symbol: "SOL", network: "Solana", price: "$188.38", change: "+3.12%", image: "assets/images/icon/SOLANA.png" },
        { symbol: "BTC", network: "Bitcoin", price: "$116,842", change: "+1.46%", image: "assets/images/icon/BTC.png" },
        { symbol: "USDT", network: "Solana", price: "$0.9998", change: "−0.02%", image: "assets/images/icon/USDT.png" }
      ]
    }
  };

  const marketData = {
    FLON: { price: "$0.0842", change: "+8.24% 今日", high: "$0.0891", low: "$0.0762", volume: "8.42M" },
    SING: { price: "$0.0196", change: "−2.18% 今日", high: "$0.0208", low: "$0.0189", volume: "3.16M" },
    USDT: { price: "$1.0002", change: "+0.02% 今日", high: "$1.0010", low: "$0.9994", volume: "24.80M" },
    BTC: { price: "$116,842", change: "+1.46% 今日", high: "$118,420", low: "$113,916", volume: "$38.2B" },
    ETH: { price: "$3,742.16", change: "−0.62% 今日", high: "$3,806", low: "$3,698", volume: "$18.4B" },
    SOL: { price: "$188.38", change: "+3.12% 今日", high: "$192.10", low: "$180.64", volume: "$4.2B" }
  };

  const state = {
    currentView: "home",
    currentWallet: "日常钱包",
    activeModal: null,
    returnFocus: null,
    aimeEnabled: localStorage.getItem("hufu-aime-enabled") !== "false",
    aimeCollapsed: localStorage.getItem("hufu-aime-collapsed") === "true",
    assetsVisible: true,
    demoState: "ready",
    pendingDapp: null,
    walletFlowMode: "create",
    walletFlowStep: 1,
    discoverNetwork: "all",
    discoverType: "all",
    bridgeStatus: "ready",
    transfer: { amount: "280.00", asset: "FLON", recipient: "flon4A…y7W9" },
    toastTimer: null,
    marketCategory: "all",
    chartRange: "1d",
    marketSort: "default"
  };

  const viewNames = { home: "Hufu 首页", social: "社交", market: "市场", discover: "发现", profile: "我的" };
  const overlay = document.querySelector("[data-overlay]");
  const toast = document.querySelector(".toast");
  const toastText = document.querySelector("[data-toast-text]");
  const aimeFab = document.querySelector(".aime-fab");
  const aimeSwitch = document.querySelector(".switch[data-action='toggle-aime']");
  const appFrame = document.querySelector("#app-frame");
  let aimePointerStartX = 0;
  let aimePointerId = null;
  let aimeDragging = false;
  let aimeLongPressTimer = null;
  let suppressAimeClick = false;
  const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

  function currentWallet() {
    return walletData[state.currentWallet];
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    toastText.textContent = message;
    toast.hidden = false;
    state.toastTimer = window.setTimeout(() => toast.hidden = true, 2400);
  }

  function switchView(view) {
    if (!viewNames[view]) return;
    document.querySelectorAll(".page-view").forEach((page) => {
      const active = page.dataset.view === view;
      page.hidden = !active;
      page.classList.toggle("is-active", active);
    });
    document.querySelectorAll("[data-nav]").forEach((button) => {
      const active = button.dataset.nav === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    state.currentView = view;
    document.querySelectorAll("[data-aime-context]").forEach((target) => target.textContent = viewNames[view]);
    try {
      if (history.replaceState) {
        history.replaceState(null, "", `#page=${view}`);
      } else {
        location.hash = `#page=${view}`;
      }
    } catch {}
  }

  function getModal(name) {
    return document.querySelector(`[data-modal="${name}"]`);
  }

  function openModal(name, trigger) {
    const modal = getModal(name);
    if (!modal) return;
    if (state.activeModal) closeModal(false);
    state.returnFocus = trigger || document.activeElement;
    overlay.hidden = false;
    modal.hidden = false;
    state.activeModal = name;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => modal.querySelector(focusableSelector)?.focus());
  }

  function closeModal(restoreFocus = true) {
    if (!state.activeModal) return;
    getModal(state.activeModal).hidden = true;
    overlay.hidden = true;
    document.body.style.overflow = "";
    state.activeModal = null;
    if (restoreFocus && state.returnFocus instanceof HTMLElement) state.returnFocus.focus();
  }

  function setAimeEnabled(enabled, message = true) {
    state.aimeEnabled = enabled;
    localStorage.setItem("hufu-aime-enabled", String(enabled));
    aimeFab.hidden = !enabled;
    aimeSwitch.classList.toggle("is-on", enabled);
    aimeSwitch.setAttribute("aria-checked", String(enabled));
    if (!enabled && state.activeModal === "aime") closeModal(false);
    if (message) showToast(enabled ? "Aime 已开启，可从悬浮按钮唤醒" : "Aime 已关闭，可在“我的”中重新开启");
  }

  function setAimeCollapsed(collapsed, persist = true) {
    state.aimeCollapsed = collapsed;
    aimeFab.classList.toggle("is-collapsed", collapsed);
    aimeFab.setAttribute("aria-label", collapsed ? "展开 Aime 智能助手" : "打开 Aime 智能助手");
    if (persist) localStorage.setItem("hufu-aime-collapsed", String(collapsed));
  }

  aimeFab.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button > 0) return;
    aimePointerId = event.pointerId;
    aimePointerStartX = event.clientX;
    aimeDragging = false;
    suppressAimeClick = false;
    aimeFab.setPointerCapture(event.pointerId);
    aimeFab.classList.add("is-dragging");
    aimeLongPressTimer = window.setTimeout(() => {
      suppressAimeClick = true;
      setAimeCollapsed(true);
    }, 520);
  });

  aimeFab.addEventListener("pointermove", (event) => {
    if (event.pointerId !== aimePointerId) return;
    const distance = event.clientX - aimePointerStartX;
    if (Math.abs(distance) <= 6) return;
    aimeDragging = true;
    suppressAimeClick = true;
    window.clearTimeout(aimeLongPressTimer);
    const offset = state.aimeCollapsed
      ? Math.max(-54, Math.min(0, distance))
      : Math.min(70, Math.max(0, distance));
    aimeFab.style.transform = `translateX(${offset}px)`;
  });

  aimeFab.addEventListener("pointerup", (event) => {
    if (event.pointerId !== aimePointerId) return;
    window.clearTimeout(aimeLongPressTimer);
    const distance = event.clientX - aimePointerStartX;
    const wasDragging = aimeDragging;
    aimeFab.style.removeProperty("transform");
    aimeFab.classList.remove("is-dragging");
    aimeFab.releasePointerCapture(event.pointerId);
    aimePointerId = null;
    aimeDragging = false;
    if (!wasDragging) return;
    if (state.aimeCollapsed) setAimeCollapsed(distance >= -18);
    else setAimeCollapsed(distance > 18);
  });

  aimeFab.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== aimePointerId) return;
    window.clearTimeout(aimeLongPressTimer);
    aimeFab.style.removeProperty("transform");
    aimeFab.classList.remove("is-dragging");
    aimePointerId = null;
    aimeDragging = false;
  });

  function renderAssets(wallet) {
    const list = document.querySelector(".asset-list");
    list.innerHTML = wallet.assets.map((asset) => {
      const logo = asset.image ? `<img src="${asset.image}" alt="${asset.symbol}">` : `<span class="coin-logo letter-logo sing-logo">${asset.letter}</span>`;
      return `<button class="asset-row" type="button" data-action="open-market-detail" data-symbol="${asset.symbol}">${logo}<span><strong>${asset.symbol}</strong><small>${asset.network}</small></span><span><strong>${asset.balance}</strong><small>${asset.value}</small></span></button>`;
    }).join("");
  }

  function renderWalletDetail() {
    const wallet = currentWallet();
    document.querySelector("[data-wallet-detail-total]").textContent = wallet.total;
    document.querySelector("[data-wallet-detail-converted]").textContent = wallet.converted;
    document.querySelector("[data-wallet-detail-assets]").innerHTML = wallet.assets.map((asset) => {
      const logo = asset.image ? `<img src="${asset.image}" alt="${asset.symbol}">` : `<span class="coin-logo letter-logo sing-logo">${asset.letter}</span>`;
      return `<button class="asset-row" type="button" data-action="open-market-detail" data-symbol="${asset.symbol}">${logo}<span><strong>${asset.symbol}</strong><small>${asset.network}</small></span><span><strong>${asset.balance}</strong><small>${asset.value}</small></span></button>`;
    }).join("");
  }

  function updateWalletFlow() {
    const mode = state.walletFlowMode;
    const step = state.walletFlowStep;
    const configs = {
      create: { kicker: "本地自托管钱包", title: "创建钱包", stepTitle: "生成本地钱包与账户", stepCopy: "密钥只在当前设备生成。本原型不生成、显示或收集真实助记词和私钥。", method: "新建本地密钥", resultTitle: "钱包已准备好", resultCopy: "已生成 FullOn 账户并保存本地昵称，可以进入首页继续体验。", warning: "请离线备份真实钱包的助记词和私钥。" },
      import: { kicker: "仅在设备内处理", title: "导入钱包", stepTitle: "导入已有本地钱包", stepCopy: "本原型只说明导入步骤，不请求真实助记词或私钥。正式产品应在安全输入环境中本地处理。", method: "演示导入，不收集密钥", resultTitle: "钱包已导入", resultCopy: "演示账户已加入当前设备，本地昵称不会从其他设备自动恢复。", warning: "确认来源可信，并避免在聊天或网页中输入助记词。" },
      recover: { kicker: "RWID 账户恢复", title: "恢复账户控制权", stepTitle: "验证 RWID 并准备新公钥", stepCopy: "新设备先生成本地新密钥，再通过已绑定手机号验证并授权账户换绑。", method: "新密钥 + RWID 验证", resultTitle: "账户控制权已恢复", resultCopy: "账户已换绑至新公钥；旧私钥不会被找回或导出。", warning: "正式换绑需要验证码限频、异常设备识别、冷静期和旧设备通知。" }
    };
    const config = configs[mode];
    document.querySelector("[data-onboarding-kicker]").textContent = config.kicker;
    document.querySelector("[data-onboarding-title]").textContent = config.title;
    document.querySelector("[data-onboarding-step-title]").textContent = config.stepTitle;
    document.querySelector("[data-onboarding-step-copy]").textContent = config.stepCopy;
    document.querySelector("[data-onboarding-method]").textContent = config.method;
    document.querySelector("[data-onboarding-result-title]").textContent = config.resultTitle;
    document.querySelector("[data-onboarding-result-copy]").textContent = config.resultCopy;
    document.querySelector("[data-flow-warning]").textContent = config.warning;
    document.querySelector("[data-recovery-field]").hidden = mode !== "recover";
    document.querySelector("[data-recovery-safety]").hidden = mode !== "recover";
    document.querySelector("[data-rwid-choice]").hidden = mode === "recover";
    document.querySelectorAll("[data-flow-step]").forEach((panel) => panel.hidden = Number(panel.dataset.flowStep) !== step);
    document.querySelectorAll("[data-flow-indicator]").forEach((indicator) => indicator.classList.toggle("is-active", Number(indicator.dataset.flowIndicator) <= step));
  }

  function openWalletFlow(mode, trigger) {
    state.walletFlowMode = mode;
    state.walletFlowStep = 1;
    updateWalletFlow();
    openModal("wallet-onboarding", trigger);
  }

  function setWalletFlowStep(step) {
    state.walletFlowStep = Math.max(1, Math.min(3, step));
    if (state.walletFlowStep === 3) {
      const nickname = document.querySelector('[name="onboardingNickname"]').value.trim() || "新钱包";
      document.querySelector("[data-onboarding-result-nickname]").textContent = nickname;
    }
    updateWalletFlow();
  }

  function filterDiscover() {
    let visible = 0;
    document.querySelectorAll("[data-discover-grid] .discover-card").forEach((card) => {
      const networkMatch = state.discoverNetwork === "all" || card.dataset.discoverNetwork === state.discoverNetwork;
      const typeMatch = state.discoverType === "all" || card.dataset.discoverType === state.discoverType;
      card.hidden = !(networkMatch && typeMatch);
      if (!card.hidden) visible += 1;
    });
    document.querySelector("[data-discover-empty]").hidden = visible > 0;
    const featured = document.querySelector(".featured-dapp");
    featured.hidden = !((state.discoverNetwork === "all" || state.discoverNetwork === "FullOn") && (state.discoverType === "all" || state.discoverType === "trade"));
  }

  function resetDiscover() {
    state.discoverNetwork = "all";
    state.discoverType = "all";
    document.querySelectorAll(".chain-chips [data-discover-network]").forEach((button) => button.classList.toggle("is-active", button.dataset.discoverNetwork === "all"));
    document.querySelectorAll(".type-chips [data-discover-type]").forEach((button) => button.classList.toggle("is-active", button.dataset.discoverType === "all"));
    filterDiscover();
  }

  function renderBridgeStatus(status) {
    const configs = {
      ready: { title: "跨链参数已准备", copy: "源链确认、桥接处理、目标链到账会分别记录状态。本原型未提交真实交易。", timeline: [["参数核对完成", "当前步骤", true], ["源链确认", "等待签名后开始", false], ["目标链到账", "预计 8–15 分钟", false]], recovery: false },
      failed: { title: "源链确认失败", copy: "交易未进入桥接处理，资产仍在源链账户中。请核对网络费用后重试。", timeline: [["参数核对完成", "已完成", true], ["源链确认", "网络费用不足", false], ["目标链到账", "尚未开始", false]], recovery: true },
      timeout: { title: "目标链到账超时", copy: "源链交易已确认，FullBridge 正在继续追踪。请勿重复提交同一笔跨链。", timeline: [["参数核对完成", "已完成", true], ["源链确认", "已完成", true], ["目标链到账", "超过预计时间", false]], recovery: true },
      unsupported: { title: "当前资产暂不支持", copy: "所选资产或目标网络不在 FullBridge 当前支持范围内，请返回修改参数。", timeline: [["支持范围检查", "未通过", false], ["源链确认", "未开始", false], ["目标链到账", "未开始", false]], recovery: true }
    };
    state.bridgeStatus = status;
    const config = configs[status];
    document.querySelector("[data-bridge-status-title]").textContent = config.title;
    document.querySelector("[data-bridge-status-copy]").textContent = config.copy;
    document.querySelector("[data-bridge-timeline]").innerHTML = config.timeline.map(([title, copy, done]) => `<span class="${done ? "is-done" : ""}"><i></i><strong>${title}</strong><small>${copy}</small></span>`).join("");
    document.querySelector("[data-bridge-recovery]").hidden = !config.recovery;
    document.querySelector("[data-bridge-complete]").hidden = config.recovery;
    document.querySelector("[data-bridge-history]").hidden = config.recovery;
    document.querySelectorAll("[data-bridge-status]").forEach((button) => button.classList.toggle("is-active", button.dataset.bridgeStatus === status));
  }

  function renderHomeMarkets(wallet) {
    const list = document.querySelector(".home-content .market-card");
    list.innerHTML = wallet.markets.map((market) => {
      const positive = market.change.startsWith("+");
      const logo = market.image ? `<img class="coin-logo" src="${market.image}" alt="${market.symbol}">` : `<span class="coin-logo letter-logo sing-logo">${market.letter}</span>`;
      const path = positive ? "M2 24c8-2 9-9 17-9s9 5 16 2 12-14 19-12 8 5 16-3" : "M2 5c8 1 11 10 18 8s10-7 17-3 8 12 16 10 10-7 17 5";
      return `<button class="market-row" type="button" data-action="open-market-detail" data-symbol="${market.symbol}">${logo}<span class="coin-name"><strong>${market.symbol}</strong><small>${market.network}</small></span><span class="sparkline ${positive ? "up-line" : "down-line"}" aria-hidden="true"><svg viewBox="0 0 72 28"><path d="${path}"/></svg></span><span class="price"><strong>${market.price}</strong><small class="${positive ? "up" : "down"}">${market.change}</small></span></button>`;
    }).join("");
  }

  function updateWallet(option) {
    state.currentWallet = option.dataset.wallet;
    const wallet = currentWallet();
    document.querySelectorAll(".wallet-option").forEach((item) => item.classList.toggle("is-selected", item === option));
    document.querySelectorAll(".wallet-name").forEach((target) => target.textContent = state.currentWallet);
    document.querySelectorAll(".wallet-network").forEach((target) => target.textContent = wallet.network);
    document.querySelectorAll(".wallet-address").forEach((target) => target.textContent = wallet.address);
    document.querySelectorAll(".context-label").forEach((target) => target.textContent = wallet.account);
    document.querySelector(".wallet-value .asset-value").textContent = state.assetsVisible ? wallet.total : "••••••";
    document.querySelector(".wallet-value .asset-subvalue").textContent = state.assetsVisible ? wallet.converted : "••••••";
    renderAssets(wallet);
    renderWalletDetail();
    renderHomeMarkets(wallet);
    closeModal(false);
    showToast(`已切换至 ${wallet.network} · ${state.currentWallet}，页面上下文已同步`);
  }

  async function copyAddress() {
    const wallet = currentWallet();
    try {
      await navigator.clipboard.writeText(wallet.fullAddress);
      showToast(`已复制完整地址 ${wallet.address}`);
    } catch {
      const input = document.createElement("textarea");
      input.value = wallet.fullAddress;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      showToast(`已复制完整地址 ${wallet.address}`);
    }
  }

  function prepareDapp(button) {
    const name = button.dataset.dapp || "DApp";
    const domain = button.dataset.domain || "待确认";
    const network = button.dataset.network || "当前网络";
    const mismatch = currentWallet().network !== network;
    state.pendingDapp = { name, domain, network, mismatch };
    document.querySelector("[data-dapp-name]").textContent = name;
    document.querySelector("[data-dapp-domain]").textContent = domain;
    document.querySelector("[data-dapp-network]").textContent = network;
    document.querySelector("[data-dapp-executor]").textContent = name === "FullSwap" ? "FullSwap 智能合约" : `${name} 外部应用`;
    const logo = document.querySelector("[data-dapp-logo]");
    logo.textContent = name === "FullBridge" ? "FB" : "FS";
    logo.classList.toggle("logo-bridge", name === "FullBridge");
    const warningTitle = document.querySelector('[data-modal="dapp"] .warning-box strong');
    const warningCopy = document.querySelector('[data-modal="dapp"] .warning-box span');
    const confirmButton = document.querySelector('[data-action="confirm-dapp"]');
    warningTitle.textContent = mismatch ? `需要切换至 ${network} 网络` : "后续操作仍需你的确认";
    warningCopy.textContent = mismatch ? `当前为 ${currentWallet().network}。确认后只切换演示上下文，不会自动连接钱包。` : "连接、授权、签名和交易不会自动执行。";
    confirmButton.textContent = mismatch ? `切换至 ${network} 并打开` : "确认并打开 DApp";
    openModal("dapp", button);
  }

  function toggleAssets() {
    state.assetsVisible = !state.assetsVisible;
    const wallet = currentWallet();
    const value = document.querySelector(".wallet-value .asset-value");
    const subvalue = document.querySelector(".wallet-value .asset-subvalue");
    value.textContent = state.assetsVisible ? wallet.total : "••••••";
    subvalue.textContent = state.assetsVisible ? wallet.converted : "••••••";
    const use = document.querySelector(".asset-eye use");
    use.setAttribute("href", state.assetsVisible ? "#i-eye" : "#i-eye-off");
  }

  function setDemoState(nextState) {
    state.demoState = nextState;
    appFrame.dataset.demoState = nextState;
    document.querySelectorAll("[data-demo-state]").forEach((button) => button.classList.toggle("is-active", button.dataset.demoState === nextState));
    const card = document.querySelector("[data-home-state-card]");
    const wallet = currentWallet();
    card.hidden = nextState === "ready";
    const configs = {
      none: { kicker: "首次使用", title: "创建你的第一个钱包", copy: "创建、导入钱包，或通过 RWID 恢复账户控制权。", actions: ["创建钱包", "导入钱包", "通过 RWID 恢复"] },
      empty: { kicker: `${wallet.network} · ${state.currentWallet}`, title: "钱包已经准备好", copy: "当前账户还没有资产。你可以先收款，或了解网络与资产安全知识。", actions: ["立即收款", "安全指南"] },
      error: { kicker: "本地钱包功能正常", title: "行情与快讯暂时无法加载", copy: "资产和钱包操作不受影响，请检查网络后重试信息模块。", actions: ["重新加载", "网络诊断"] }
    };
    if (configs[nextState]) {
      const config = configs[nextState];
      card.querySelector("[data-state-kicker]").textContent = config.kicker;
      card.querySelector("[data-state-title]").textContent = config.title;
      card.querySelector("[data-state-copy]").textContent = config.copy;
      card.querySelector("[data-state-actions]").innerHTML = config.actions.map((label, index) => `<button class="${index ? "secondary-button" : "primary-button"}" type="button" data-state-cta="${label}">${label}</button>`).join("");
    }
    if (nextState === "empty") {
      document.querySelector(".wallet-value .asset-value").textContent = "$0.00";
      document.querySelector(".wallet-value .asset-subvalue").textContent = "等待第一笔资产";
    } else if (nextState === "ready") {
      document.querySelector(".wallet-value .asset-value").textContent = wallet.total;
      document.querySelector(".wallet-value .asset-subvalue").textContent = wallet.converted;
    }
    closeModal(false);
    switchView("home");
  }

  function prepareMarket(symbol) {
    const data = marketData[symbol] || marketData.FLON;
    document.querySelector("[data-market-symbol]").textContent = symbol;
    document.querySelector("[data-market-price]").textContent = data.price;
    const change = document.querySelector("[data-market-change]");
    change.textContent = data.change;
    change.className = data.change.startsWith("+") ? "up" : "down";
    const latest = document.querySelector("[data-market-latest]");
    if (latest) latest.textContent = data.price;
    document.querySelector("[data-market-high]").textContent = data.high;
    document.querySelector("[data-market-low]").textContent = data.low;
    document.querySelector("[data-market-volume]").textContent = data.volume;
    openModal("market-detail", document.activeElement);
  }

  function filterMarket(category) {
    state.marketCategory = category;
    document.querySelectorAll("[data-market-category]").forEach((button) => {
      const isActive = button.dataset.marketCategory === category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    const list = document.querySelector("[data-market-list]");
    if (!list) return;
    const majorNetworks = ["Bitcoin", "Ethereum", "Solana", "BSC", "Tron"];
    const rows = list.querySelectorAll(".market-row");
    let visibleCount = 0;
    rows.forEach((row) => {
      const network = row.dataset.marketNetwork || "all";
      const show = category === "watchlist" || category === "all" || network === category || (category === "major" && majorNetworks.includes(network));
      row.hidden = !show;
      if (show) visibleCount++;
    });
    const empty = document.querySelector("[data-market-empty]");
    if (empty) empty.hidden = visibleCount > 0;

    const heroPair = document.querySelector(".market-hero .coin-pair");
    const heroPrice = document.querySelector(".market-hero h2");
    const heroChange = document.querySelector(".market-hero .market-hero-top .up, .market-hero .market-hero-top .down");
    const heroChartLabel = document.querySelector(".large-chart");
    if (category === "major") {
      const data = marketData.BTC;
      if (heroPair) heroPair.textContent = "BTC / USDT";
      if (heroPrice) heroPrice.textContent = data.price;
      if (heroChange) {
        heroChange.textContent = data.change;
        heroChange.className = data.change.startsWith("+") ? "up" : "down";
      }
      if (heroChartLabel) heroChartLabel.setAttribute("aria-label", "BTC 今日价格呈上升趋势");
    } else {
      const data = marketData.FLON;
      if (heroPair) heroPair.textContent = "FLON / USDT";
      if (heroPrice) heroPrice.textContent = data.price;
      if (heroChange) {
        heroChange.textContent = data.change;
        heroChange.className = data.change.startsWith("+") ? "up" : "down";
      }
      if (heroChartLabel) heroChartLabel.setAttribute("aria-label", "FLON 今日价格呈上升趋势");
    }
  }

  function resetMarketCategory() {
    filterMarket("all");
  }

  function setChartRange(range) {
    state.chartRange = range;
    document.querySelectorAll("[data-chart-range]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.chartRange === range);
    });
    showToast(`已切换至 ${range.toUpperCase()} 周期`);
  }

  function toggleMarketSort() {
    const sorts = ["default", "change-desc", "change-asc", "volume"];
    const current = sorts.indexOf(state.marketSort);
    state.marketSort = sorts[(current + 1) % sorts.length];
    const labels = { default: "默认排序", "change-desc": "涨幅最高", "change-asc": "涨幅最低", volume: "成交量优先" };
    showToast(`行情列表：${labels[state.marketSort]}`);
  }

  function toggleNews(card) {
    const body = card.querySelector(".news-body");
    if (!body) return;
    card.classList.toggle("is-expanded");
  }

  function addAimeMessage(text, user = false, pending = false) {
    const messages = document.querySelector(".aime-messages");
    const wrapper = document.createElement("div");
    wrapper.className = `message ${user ? "user-message" : "aime-message"}${pending ? " pending-message" : ""}`;
    if (!user) {
      const avatar = document.createElement("img");
      avatar.src = "assets/images/ai/ai_avatar.png";
      avatar.alt = "";
      wrapper.appendChild(avatar);
    }
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    wrapper.appendChild(paragraph);
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
    return wrapper;
  }

  function answerAime(question) {
    const wallet = currentWallet();
    const answers = {
      "FullSwap 是什么？": "FullSwap 是 FullOn 生态的去中心化兑换入口。打开前请确认官方域名 fullswap.flon.network，连接、授权和交易仍需逐步确认。",
      "如何安全跨链？": "先核对源链、目标链、资产、接收账户和预计到账数量。异常授权、网络不匹配或域名错误时应立即停止。",
      "解释当前网络": `当前是 ${wallet.network} 网络和${state.currentWallet}。切换钱包后，资产、行情、DApp 和后续签名上下文会同步更新。`
    };
    addAimeMessage(question, true);
    const pending = addAimeMessage("正在结合当前页面整理…", false, true);
    window.setTimeout(() => {
      pending.remove();
      const answer = addAimeMessage(answers[question] || "我已整理操作路径。原型只提供说明，不会替你连接钱包、签名或发起交易。", false);
      if (question === "FullSwap 是什么？") {
        const action = document.createElement("button");
        action.type = "button";
        action.className = "aime-message-action";
        action.dataset.action = "open-dapp";
        action.dataset.dapp = "FullSwap";
        action.dataset.domain = "fullswap.flon.network";
        action.dataset.network = "FullOn";
        action.textContent = "查看 FullSwap 访问确认";
        answer.appendChild(action);
      }
    }, 520);
  }

  function setExclusiveActive(button) {
    const group = button.parentElement;
    group.querySelectorAll(":scope > button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      if (item.getAttribute("role") === "tab") item.setAttribute("aria-selected", String(active));
    });
  }

  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav) return switchView(nav.dataset.nav);
    const viewTarget = event.target.closest("[data-view-target]");
    if (viewTarget) return switchView(viewTarget.dataset.viewTarget);
    const walletOption = event.target.closest(".wallet-option");
    if (walletOption) return updateWallet(walletOption);
    const discoverNetwork = event.target.closest(".chain-chips [data-discover-network]");
    if (discoverNetwork) {
      state.discoverNetwork = discoverNetwork.dataset.discoverNetwork;
      setExclusiveActive(discoverNetwork);
      filterDiscover();
      return;
    }
    const discoverType = event.target.closest(".type-chips [data-discover-type]");
    if (discoverType) {
      state.discoverType = discoverType.dataset.discoverType;
      setExclusiveActive(discoverType);
      filterDiscover();
      return;
    }
    const bridgeState = event.target.closest("[data-bridge-status]");
    if (bridgeState) return renderBridgeStatus(bridgeState.dataset.bridgeStatus);
    const demoState = event.target.closest("button[data-demo-state]");
    if (demoState) return setDemoState(demoState.dataset.demoState);
    const stateCta = event.target.closest("[data-state-cta]");
    if (stateCta) {
      if (stateCta.dataset.stateCta === "立即收款") return openModal("receive", stateCta);
      if (stateCta.dataset.stateCta === "重新加载") return setDemoState("ready");
      if (stateCta.dataset.stateCta === "创建钱包") return openWalletFlow("create", stateCta);
      if (stateCta.dataset.stateCta === "导入钱包") return openWalletFlow("import", stateCta);
      if (stateCta.dataset.stateCta === "通过 RWID 恢复") return openWalletFlow("recover", stateCta);
      return showToast(`${stateCta.dataset.stateCta}流程将在独立安全页面完成`);
    }
    const aimePrompt = event.target.closest("[data-aime-prompt]");
    if (aimePrompt) return answerAime(aimePrompt.dataset.aimePrompt);
    const exclusiveButton = event.target.closest(".segmented-control button, .asset-tabs button, .chain-chips button, .chart-range button, .record-filters button, .state-chips button");
    if (exclusiveButton) {
      setExclusiveActive(exclusiveButton);
      if (exclusiveButton.dataset.marketCategory) filterMarket(exclusiveButton.dataset.marketCategory);
      if (exclusiveButton.dataset.chartRange) setChartRange(exclusiveButton.dataset.chartRange);
      return;
    }
    if (event.target.closest("[data-close-modal]") || event.target === overlay) return closeModal();
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === "open-wallet") openModal("wallet", actionTarget);
    if (action === "open-wallet-detail") {
      renderWalletDetail();
      openModal("wallet-detail", actionTarget);
    }
    if (action === "next-wallet-flow") setWalletFlowStep(state.walletFlowStep + 1);
    if (action === "prev-wallet-flow") setWalletFlowStep(state.walletFlowStep - 1);
    if (action === "complete-wallet-flow") {
      closeModal(false);
      setDemoState("ready");
      showToast(state.walletFlowMode === "recover" ? "RWID 恢复演示完成，已换绑至新公钥" : "钱包流程演示完成，已进入首页");
    }
    if (action === "reset-discover") resetDiscover();
    if (action === "market-search") showToast("搜索币种名称、代码或网络");
    if (action === "market-sort") toggleMarketSort();
    if (action === "market-more-news") showToast("已加载更多市场快讯");
    if (action === "market-retry") {
      document.querySelector("[data-market-failed]").hidden = true;
      showToast("行情与快讯已重新加载");
    }
    if (action === "market-reset-category") resetMarketCategory();
    if (action === "toggle-news") toggleNews(actionTarget);
    if (action === "toast") showToast(actionTarget.dataset.message || "操作已记录");
    if (action === "copy-address") copyAddress();
    if (action === "open-dapp") prepareDapp(actionTarget);
    if (action === "open-transfer") openModal("transfer-form", actionTarget);
    if (action === "open-receive") openModal("receive", actionTarget);
    if (action === "open-history") openModal("history", actionTarget);
    if (action === "open-scan") openModal("scan", actionTarget);
    if (action === "open-bridge") {
      const targetNetwork = currentWallet().network === "FullOn" ? "Ethereum" : "FullOn";
      document.querySelectorAll("[data-bridge-target]").forEach((target) => target.textContent = targetNetwork);
      openModal("bridge", actionTarget);
    }
    if (action === "open-security") openModal("security", actionTarget);
    if (action === "open-nickname") {
      document.querySelector("[data-nickname-form]").elements.nickname.value = state.currentWallet;
      openModal("nickname", actionTarget);
    }
    if (action === "open-market-detail") prepareMarket(actionTarget.dataset.symbol);
    if (action === "toggle-assets") toggleAssets();
    if (action === "simulate-scan") {
      document.querySelector("[data-scan-result]").hidden = false;
      actionTarget.textContent = "继续核对解析结果";
      showToast("解析完成，尚未连接、授权或签名");
    }
    if (action === "fill-max") {
      const form = document.querySelector("[data-transfer-form]");
      form.elements.amount.value = state.currentWallet === "日常钱包" ? "185420.80" : "2.8042";
    }
    if (action === "fill-bridge-max") document.querySelector("[data-bridge-form]").elements.amount.value = "8240.20";
    if (action === "retry-bridge") renderBridgeStatus("ready");
    if (action === "return-bridge") openModal("bridge", actionTarget);
    if (action === "open-aime") {
      if (suppressAimeClick) {
        suppressAimeClick = false;
        return;
      }
      if (state.aimeCollapsed) return setAimeCollapsed(false);
      return state.aimeEnabled ? openModal("aime", actionTarget) : showToast("请先在“我的”中开启 Aime");
    }
    if (action === "toggle-aime") setAimeEnabled(!state.aimeEnabled);
    if (action === "toggle-aime-full") {
      const panel = getModal("aime");
      panel.classList.toggle("is-full");
      actionTarget.setAttribute("aria-pressed", String(panel.classList.contains("is-full")));
    }
    if (action === "minimize-aime") closeModal();
    if (action === "disable-aime") setAimeEnabled(false);
    if (action === "confirm-dapp") {
      const pending = state.pendingDapp;
      if (pending?.mismatch && pending.network === "FullOn") {
        updateWallet(document.querySelector('.wallet-option[data-wallet="日常钱包"]'));
      } else closeModal(false);
      showToast(`已确认官方域名，正在模拟打开 ${pending?.name || "DApp"}`);
    }
    if (action === "confirm-transfer") openModal("transfer-result", actionTarget);
  });

  document.querySelector("[data-transfer-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    state.transfer.amount = Number(form.elements.amount.value).toFixed(2);
    state.transfer.asset = form.elements.asset.value;
    state.transfer.recipient = form.elements.recipient.value;
    document.querySelector('[data-modal="transfer"] .amount-summary strong').innerHTML = `${state.transfer.amount} <small>${state.transfer.asset}</small>`;
    document.querySelector('[data-modal="transfer"] .confirm-list .mono').textContent = `${state.transfer.recipient.slice(0, 7)}…${state.transfer.recipient.slice(-4)}`;
    document.querySelector("[data-result-amount]").textContent = `${state.transfer.amount} ${state.transfer.asset}`;
    openModal("transfer", form.querySelector("button[type='submit']"));
  });

  document.querySelector("[data-bridge-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    renderBridgeStatus("ready");
    openModal("bridge-result", event.currentTarget.querySelector("button[type='submit']"));
  });

  document.querySelector("[data-nickname-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.nickname;
    const nickname = input.value.trim();
    const help = document.querySelector("[data-nickname-help]");
    if (!nickname) {
      help.textContent = "请输入钱包昵称。";
      help.classList.add("down");
      input.focus();
      return;
    }
    if (walletData[nickname] && nickname !== state.currentWallet) {
      help.textContent = "该昵称已在当前设备使用，请换一个名称。";
      help.classList.add("down");
      input.focus();
      return;
    }
    const oldName = state.currentWallet;
    if (nickname !== oldName) {
      walletData[nickname] = walletData[oldName];
      delete walletData[oldName];
      const option = document.querySelector(`.wallet-option[data-wallet="${oldName}"]`);
      option.dataset.wallet = nickname;
      option.querySelector("strong").textContent = nickname;
      state.currentWallet = nickname;
      document.querySelectorAll(".wallet-name").forEach((target) => target.textContent = nickname);
    }
    help.textContent = "同一设备内必须唯一，不会上链或上传社交服务。";
    help.classList.remove("down");
    closeModal(false);
    showToast(`已在本设备保存昵称“${nickname}”`);
  });

  document.querySelector("[data-aime-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.message;
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    answerAime(value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeModal) return closeModal();
    if (event.key !== "Tab" || !state.activeModal) return;
    const modal = getModal(state.activeModal);
    const focusable = [...modal.querySelectorAll(focusableSelector)].filter((item) => !item.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  setAimeEnabled(state.aimeEnabled, false);
  setAimeCollapsed(state.aimeCollapsed, false);
  renderAssets(currentWallet());
  renderWalletDetail();
  renderHomeMarkets(currentWallet());
  filterDiscover();
  filterMarket(state.marketCategory);
  setChartRange(state.chartRange);

  const initialPage = new URLSearchParams(location.hash.slice(1)).get("page");
  const startView = viewNames[initialPage] ? initialPage : "home";
  switchView(startView);

  window.addEventListener("hashchange", () => {
    const page = new URLSearchParams(location.hash.slice(1)).get("page");
    if (page && viewNames[page] && page !== state.currentView) {
      switchView(page);
    }
  });
})();
