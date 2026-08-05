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
    transfer: { amount: "280.00", asset: "FLON", recipient: "flon4A…y7W9" },
    toastTimer: null
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
      none: { kicker: "首次使用", title: "创建你的第一个钱包", copy: "创建、导入钱包，或通过 RWID 恢复账户控制权。", actions: ["创建钱包", "导入钱包", "恢复演示钱包"] },
      empty: { kicker: `${wallet.network} · ${state.currentWallet}`, title: "钱包已经准备好", copy: "当前账户还没有资产。你可以先收款，或了解网络与资产安全知识。", actions: ["立即收款", "安全指南"] },
      error: { kicker: "本地钱包功能正常", title: "行情与快讯暂时无法加载", copy: "资产和钱包操作不受影响，请检查网络后重试信息模块。", actions: ["重新加载", "网络诊断"] }
    };
    if (configs[nextState]) {
      const config = configs[nextState];
      card.querySelector("[data-state-kicker]").textContent = config.kicker;
      card.querySelector("[data-state-title]").textContent = config.title;
      card.querySelector("[data-state-copy]").textContent = config.copy;
      card.querySelector("[data-state-actions]").innerHTML = config.actions.map((label, index) => `<button class="${index ? "secondary-button" : "primary-button"}" type="button" ${label === "恢复演示钱包" ? 'data-demo-state="ready"' : `data-state-cta="${label}"`}>${label}</button>`).join("");
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
    document.querySelector("[data-market-high]").textContent = data.high;
    document.querySelector("[data-market-low]").textContent = data.low;
    document.querySelector("[data-market-volume]").textContent = data.volume;
    openModal("market-detail", document.activeElement);
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
      addAimeMessage(answers[question] || "我已整理操作路径。原型只提供说明，不会替你连接钱包、签名或发起交易。", false);
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
    const demoState = event.target.closest("[data-demo-state]");
    if (demoState) return setDemoState(demoState.dataset.demoState);
    const stateCta = event.target.closest("[data-state-cta]");
    if (stateCta) {
      if (stateCta.dataset.stateCta === "立即收款") return openModal("receive", stateCta);
      if (stateCta.dataset.stateCta === "重新加载") return setDemoState("ready");
      if (stateCta.dataset.stateCta === "恢复演示钱包") return setDemoState("ready");
      return showToast(`${stateCta.dataset.stateCta}流程将在独立安全页面完成`);
    }
    const aimePrompt = event.target.closest("[data-aime-prompt]");
    if (aimePrompt) return answerAime(aimePrompt.dataset.aimePrompt);
    const exclusiveButton = event.target.closest(".segmented-control button, .asset-tabs button, .chain-chips button, .chart-range button, .record-filters button, .state-chips button");
    if (exclusiveButton) return setExclusiveActive(exclusiveButton);
    if (event.target.closest("[data-close-modal]") || event.target === overlay) return closeModal();
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === "open-wallet") openModal("wallet", actionTarget);
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
  renderHomeMarkets(currentWallet());
  switchView("home");
})();
