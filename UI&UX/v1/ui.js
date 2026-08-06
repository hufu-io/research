(() => {
  const frame = document.querySelector("#app-frame");
  const overlay = document.querySelector("[data-overlay]");
  const views = [...document.querySelectorAll("[data-view]")];
  const navItems = [...document.querySelectorAll("[data-nav]")];
  const aimeFab = document.querySelector(".aime-fab");
  const aimeStage = document.querySelector(".aime-pet-visual");
  const bottomNav = document.querySelector(".bottom-nav");
  const aimeComponents = window.AimeAnimationComponents;
  const aimeStorage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        return;
      }
    }
  };
  const heroCarousel = document.querySelector("[data-hero-carousel]");
  const heroSlides = [...document.querySelectorAll("[data-hero-slide]")];
  const heroDots = [...document.querySelectorAll("[data-hero-dot]")];
  const socialDrawerLayer = document.querySelector("[data-social-drawer-layer]");
  const socialDrawer = document.querySelector(".social-drawer");
  const socialDrawerTrigger = document.querySelector("[data-social-drawer-trigger]");
  const marketAppbar = document.querySelector(".market-appbar");
  const marketSearch = document.querySelector("[data-market-search]");
  const marketSearchInput = document.querySelector("[data-market-search-input]");
  const marketSearchClear = document.querySelector("[data-action='clear-market-search']");
  const marketSearchEmpty = document.querySelector("[data-market-search-empty]");
  const marketCard = document.querySelector(".market-card-flat");
  const marketSearchTrigger = document.querySelector("[data-action='open-market-search']");
  let activeModal = null;
  let returnFocus = null;
  let assetsVisible = true;
  let toastTimer = null;
  let aimeAnimation = null;
  let aimeAnimationToken = 0;
  let aimeCollapsed = true;
  let aimeEnabled = aimeStorage.get("hufu-ui-aime-enabled") !== "false";
  let aimePointerId = null;
  let aimePointerStartX = 0;
  let aimeDragging = false;
  let aimeLongPressed = false;
  let aimeThinkingTimer = null;
  let aimeLongPressTimer = null;
  let heroIndex = 0;
  let heroTimer = null;
  let pendingDapp = null;
  let marketSortKey = "";
  let marketSortDirection = "none";
  let marketFavorites = new Set();
  let marketActiveCategory = "self";

  const toast = document.createElement("div");
  toast.className = "canvas-toast";
  toast.hidden = true;
  toast.setAttribute("role", "status");
  frame.appendChild(toast);

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  function getMarketRows() {
    return [...document.querySelectorAll(".market-row-shell")];
  }

  function readMarketFavorites() {
    try {
      const stored = JSON.parse(aimeStorage.get("hufu-ui-market-favorites") || "[]");
      marketFavorites = new Set(Array.isArray(stored) ? stored : []);
    } catch {
      marketFavorites = new Set();
    }
  }

  function saveMarketFavorites() {
    aimeStorage.set("hufu-ui-market-favorites", JSON.stringify([...marketFavorites]));
  }

  function updateMarketFavoriteButton(button, favorited) {
    const symbol = button.dataset.symbol;
    button.classList.toggle("is-favorite", favorited);
    button.setAttribute("aria-pressed", String(favorited));
    button.setAttribute("aria-label", `${favorited ? "取消收藏" : "收藏"} ${symbol}`);
  }

  function initializeMarketFavorites() {
    readMarketFavorites();
    document.querySelectorAll(".market-favorite").forEach((button) => {
      updateMarketFavoriteButton(button, marketFavorites.has(button.dataset.symbol));
    });
  }

  function applyMarketSearch() {
    const query = marketSearchInput?.value.trim().toLocaleLowerCase() || "";
    let visibleCount = 0;
    getMarketRows().forEach((row) => {
      const searchable = `${row.dataset.marketSymbol || ""} ${row.dataset.marketName || ""}`.toLocaleLowerCase();
      const categoryMatches = marketActiveCategory === "self" || row.dataset.marketCategory === marketActiveCategory;
      const queryMatches = !query || searchable.includes(query);
      const visible = categoryMatches && queryMatches;
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    if (marketSearchClear) marketSearchClear.hidden = !query;
    if (marketSearchEmpty) {
      marketSearchEmpty.textContent = query ? "未找到相关币种，请尝试其他关键词" : "当前分类暂无行情";
      marketSearchEmpty.hidden = visibleCount > 0;
    }
  }

  function selectMarketCategory(tab, moveFocus = false) {
    if (!tab) return;
    marketActiveCategory = tab.dataset.marketCategory || "self";
    document.querySelectorAll("[data-market-category]").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    applyMarketSearch();
    if (moveFocus) tab.focus();
  }

  function getNextMarketTabIndex(currentIndex, tabCount, key) {
    if (key === "Home") return 0;
    if (key === "End") return tabCount - 1;
    return (currentIndex + (key === "ArrowRight" ? 1 : -1) + tabCount) % tabCount;
  }

  function openMarketSearch() {
    if (!marketSearch) return;
    marketAppbar?.classList.add("is-searching");
    marketSearch.hidden = false;
    requestAnimationFrame(() => marketSearchInput?.focus());
  }

  function clearMarketSearch() {
    if (!marketSearchInput) return;
    marketSearchInput.value = "";
    applyMarketSearch();
    marketSearchInput.focus();
  }

  function closeMarketSearch() {
    if (!marketSearch) return;
    clearMarketSearch();
    marketSearch.hidden = true;
    marketAppbar?.classList.remove("is-searching");
    marketSearchTrigger?.focus();
  }

  function sortMarketRows(button) {
    if (!marketCard) return;
    const key = button.dataset.marketSort;
    marketSortDirection = marketSortKey === key && marketSortDirection === "ascending" ? "descending" : "ascending";
    marketSortKey = key;
    const direction = marketSortDirection === "ascending" ? 1 : -1;
    const rows = getMarketRows().sort((first, second) => {
      if (key === "symbol") return first.dataset.marketSymbol.localeCompare(second.dataset.marketSymbol) * direction;
      return (Number(first.dataset[`market${key[0].toUpperCase()}${key.slice(1)}`]) - Number(second.dataset[`market${key[0].toUpperCase()}${key.slice(1)}`])) * direction;
    });
    rows.forEach((row) => marketCard.appendChild(row));
    const labels = { symbol: "币种", volume: "24h成交量", price: "最新价" };
    document.querySelectorAll("[data-market-sort]").forEach((sortButton) => {
      const active = sortButton === button;
      const state = active ? marketSortDirection : "none";
      sortButton.dataset.direction = state;
      sortButton.parentElement.setAttribute("aria-sort", state);
      sortButton.setAttribute("aria-label", `${labels[sortButton.dataset.marketSort]}，${active ? (state === "ascending" ? "升序" : "降序") : "未排序"}`);
    });
  }

  function closeSocialDrawer(restoreFocus = false) {
    if (!socialDrawerLayer || socialDrawerLayer.hidden) return;
    socialDrawerLayer.hidden = true;
    socialDrawerTrigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) socialDrawerTrigger.focus();
  }

  function openSocialDrawer() {
    if (!socialDrawerLayer) return;
    socialDrawerLayer.hidden = false;
    socialDrawerTrigger.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => socialDrawer.querySelector("[data-social-drawer-close]")?.focus());
  }

  function trapSocialDrawerFocus(event) {
    if (event.key !== "Tab" || socialDrawerLayer?.hidden) return;
    const focusable = [...socialDrawer.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")];
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
  }

  function showHeroSlide(index) {
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === heroIndex));
    heroDots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === heroIndex));
  }

  function stopHeroCarousel() {
    window.clearInterval(heroTimer);
    heroTimer = null;
  }

  function startHeroCarousel() {
    stopHeroCarousel();
    if (!heroCarousel || heroSlides.length < 2 || document.hidden) return;
    heroTimer = window.setInterval(() => showHeroSlide(heroIndex + 1), 4500);
  }

  function switchView(name) {
    closeSocialDrawer();
    views.forEach((view) => {
      const active = view.dataset.view === name;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
      if (active) view.scrollTo({ top: 0, behavior: "instant" });
    });
    if (bottomNav) bottomNav.style.display = name === "settings" ? "none" : "";
    navItems.forEach((item) => {
      const active = item.dataset.nav === name;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    try {
      if (history.replaceState) {
        history.replaceState(null, "", `#page=${name}`);
      } else {
        location.hash = `#page=${name}`;
      }
    } catch {}
  }

  function openModal(name, trigger) {
    const modal = document.querySelector(`[data-modal="${name}"]`);
    if (!modal) {
      showToast("该功能将在独立安全流程中打开");
      return;
    }
    if (activeModal) closeModal(false);
    returnFocus = trigger || document.activeElement;
    activeModal = modal;
    overlay.hidden = false;
    modal.hidden = false;
    requestAnimationFrame(() => (modal.querySelector("[data-initial-focus]") || modal.querySelector("button, input, select"))?.focus());
  }

  function closeModal(restoreFocus = true) {
    if (!activeModal) return;
    activeModal.hidden = true;
    overlay.hidden = true;
    activeModal = null;
    if (restoreFocus && returnFocus instanceof HTMLElement) returnFocus.focus();
  }

  function updateWallet(option) {
    document.querySelectorAll(".wallet-option").forEach((item) => item.classList.toggle("is-selected", item === option));
    document.querySelectorAll(".wallet-name").forEach((item) => item.textContent = option.dataset.wallet);
    document.querySelectorAll(".wallet-network").forEach((item) => item.textContent = option.dataset.network);
    document.querySelectorAll(".wallet-address").forEach((item) => item.textContent = option.dataset.address);
    closeModal(false);
    showToast(`已切换至 ${option.dataset.network} · ${option.dataset.wallet}`);
  }

  function toggleAssets() {
    assetsVisible = !assetsVisible;
    document.querySelectorAll(".asset-value").forEach((item) => item.textContent = assetsVisible ? "$24,860.42" : "••••••");
    document.querySelectorAll(".asset-subvalue").forEach((item) => item.textContent = assetsVisible ? "≈ 24,856.90 USDT" : "••••••");
  }

  function prepareDappConfirm(button) {
    const name = button.dataset.dapp || "DApp";
    const domain = button.dataset.domain || "待确认";
    const network = button.dataset.network || "当前网络";
    const logoText = button.dataset.logo || name.slice(0, 2).toUpperCase();
    pendingDapp = { name, domain, network };
    document.querySelector("[data-dapp-confirm-name]").textContent = name;
    document.querySelector("[data-dapp-confirm-domain]").textContent = domain;
    document.querySelector("[data-dapp-confirm-network]").textContent = network;
    const logo = document.querySelector("[data-dapp-confirm-logo]");
    logo.textContent = logoText;
    logo.classList.toggle("logo-bridge", name === "FullBridge");
    logo.classList.toggle("logo-rwa", name === "FullOn RWA");
    logo.classList.toggle("logo-redpacket", name === "Red Packet");
    return openModal("dapp-confirm", button);
  }

  function createAimeAnimation(component, options) {
    return component.createAnimation(options);
  }

  function playAimeState(state, onComplete) {
    const component = aimeComponents.get(state);
    const token = ++aimeAnimationToken;
    aimeFab.dataset.state = state;
    aimeAnimation?.destroy();
    aimeAnimation = createAimeAnimation(component, {
      container: aimeStage,
      renderer: "svg",
      loop: component.loop,
      autoplay: true,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
    });
    if (onComplete && aimeAnimation) {
      aimeAnimation.addEventListener("complete", () => {
        if (token === aimeAnimationToken) onComplete();
      });
    }
  }

  function loadAimePeekAnimation(token) {
    const component = aimeComponents.get("peek2");
    aimeFab.dataset.state = "peek2";
    aimeAnimation?.destroy();
    aimeAnimation = createAimeAnimation(component, {
      container: aimeStage,
      renderer: "svg",
      loop: false,
      autoplay: false,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
    });
    return { animation: aimeAnimation, component, token };
  }

  function playAimePeek() {
    const token = ++aimeAnimationToken;
    const { animation, component } = loadAimePeekAnimation(token);
    if (!animation) return;
    let phase = "enter";

    const handleEnterComplete = () => {
      if (token !== aimeAnimationToken || phase !== "enter" || !aimeCollapsed) return;
      phase = "loop";
      animation.removeEventListener("complete", handleEnterComplete);
      animation.loop = true;
      animation.playSegments(component.segment("peek_loop"), true);
    };

    animation.addEventListener("complete", handleEnterComplete);
    animation.addEventListener("DOMLoaded", () => {
      if (token === aimeAnimationToken) animation.playSegments(component.segment("peek_enter"), true);
    });
  }

  function setAimeCollapsed(collapsed) {
    const stateChanged = aimeCollapsed !== collapsed;
    aimeCollapsed = collapsed;
    aimeFab.classList.toggle("is-collapsed", collapsed);
    aimeFab.setAttribute("aria-label", collapsed ? "展开 Aime 智能助手" : "打开 Aime 智能助手");
    if (!stateChanged) {
      aimeFab.classList.remove("is-transitioning");
      if (collapsed) playAimePeek();
      else playAimeState("idle");
      return;
    }
    if (collapsed) {
      aimeFab.classList.remove("is-transitioning");
      playAimePeek();
      return;
    }

    aimeFab.classList.remove("is-transitioning");
    playAimeState("idle");
  }

  function clearAimePressTimers() {
    window.clearTimeout(aimeThinkingTimer);
    window.clearTimeout(aimeLongPressTimer);
  }

  aimeFab.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button > 0 || aimePointerId !== null) return;
    aimePointerId = event.pointerId;
    aimePointerStartX = event.clientX;
    aimeDragging = false;
    aimeLongPressed = false;
    aimeFab.setPointerCapture(event.pointerId);
    aimeFab.classList.add("is-dragging");
    aimeThinkingTimer = window.setTimeout(() => {
      if (!aimeDragging && !aimeCollapsed) playAimeState("thinking");
    }, 160);
    aimeLongPressTimer = window.setTimeout(() => {
      aimeLongPressed = true;
      setAimeCollapsed(true);
    }, 620);
  });

  aimeFab.addEventListener("pointermove", (event) => {
    if (event.pointerId !== aimePointerId) return;
    const distance = event.clientX - aimePointerStartX;
    if (Math.abs(distance) <= 6 && !aimeDragging) return;
    aimeDragging = true;
    clearAimePressTimers();
    const offset = aimeCollapsed
      ? Math.max(-62, Math.min(0, distance))
      : Math.max(0, Math.min(70, distance));
    aimeFab.style.transform = `translateX(${offset}px)`;
  });

  aimeFab.addEventListener("pointerup", (event) => {
    if (event.pointerId !== aimePointerId) return;
    clearAimePressTimers();
    const distance = event.clientX - aimePointerStartX;
    const wasDragging = aimeDragging;
    const wasLongPressed = aimeLongPressed;
    aimeFab.style.removeProperty("transform");
    aimeFab.classList.remove("is-dragging");
    aimeFab.releasePointerCapture(event.pointerId);
    aimePointerId = null;

    if (wasLongPressed) return;
    if (wasDragging) {
      setAimeCollapsed(aimeCollapsed ? distance >= -20 : distance > 20);
      return;
    }
    if (aimeCollapsed) {
      setAimeCollapsed(false);
      return;
    }
    playAimeState("greeting", () => {
      playAimeState("idle");
      showToast("Aime 已准备好，可以开始提问");
    });
  });

  aimeFab.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== aimePointerId) return;
    clearAimePressTimers();
    aimeFab.style.removeProperty("transform");
    aimeFab.classList.remove("is-dragging");
    aimePointerId = null;
    if (aimeCollapsed) playAimePeek();
    else playAimeState("idle");
  });

  aimeFab.addEventListener("click", (event) => event.preventDefault());

  document.addEventListener("click", (event) => {
    const socialDrawerButton = event.target.closest("[data-social-drawer-trigger]");
    if (socialDrawerButton) {
      openSocialDrawer();
      return;
    }

    if (event.target.closest("[data-social-drawer-close]")) {
      closeSocialDrawer(true);
      return;
    }

    const socialDrawerItem = event.target.closest("[data-social-drawer-item]");
    if (socialDrawerItem) closeSocialDrawer(true);

    const nav = event.target.closest("[data-nav]");
    if (nav) return switchView(nav.dataset.nav);

    const viewTarget = event.target.closest("[data-view-target]");
    if (viewTarget) return switchView(viewTarget.dataset.viewTarget);

    const wallet = event.target.closest(".wallet-option");
    if (wallet) return updateWallet(wallet);

    const marketSortButton = event.target.closest("[data-market-sort]");
    if (marketSortButton) return sortMarketRows(marketSortButton);

    const marketCategoryTab = event.target.closest("[data-market-category]");
    if (marketCategoryTab) return selectMarketCategory(marketCategoryTab);

    const exclusive = event.target.closest(".segmented-control button, .asset-tabs button, .chain-chips button, .chart-range button, .record-filters button, .state-chips button");
    if (exclusive) {
      [...exclusive.parentElement.children].forEach((item) => {
        item.classList.remove("is-active");
        if (item.getAttribute("role") === "tab") item.setAttribute("aria-selected", "false");
      });
      exclusive.classList.add("is-active");
      if (exclusive.getAttribute("role") === "tab") exclusive.setAttribute("aria-selected", "true");
      return;
    }

    if (event.target.closest("[data-close-modal]") || event.target === overlay) return closeModal();

    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    const modalActions = {
      "open-wallet": "wallet",
      "open-transfer": "transfer-form",
      "open-receive": "receive",
      "open-history": "history",
      "open-scan": "scan"
    };
    if (modalActions[action]) return openModal(modalActions[action], actionTarget);
    if (action === "open-dapp") return prepareDappConfirm(actionTarget);
    if (action === "confirm-dapp") {
      const name = pendingDapp?.name || "DApp";
      closeModal(false);
      showToast(`已确认安全信息，正在模拟打开 ${name}`);
      return;
    }
    if (action === "toggle-assets") return toggleAssets();
    if (action === "copy-address") return showToast("钱包地址已复制");
    if (action === "open-market-search") return openMarketSearch();
    if (action === "clear-market-search") return clearMarketSearch();
    if (action === "close-market-search") return closeMarketSearch();
    if (action === "toggle-market-favorite") {
      const symbol = actionTarget.dataset.symbol;
      const favorited = !marketFavorites.has(symbol);
      if (favorited) marketFavorites.add(symbol);
      else marketFavorites.delete(symbol);
      saveMarketFavorites();
      updateMarketFavoriteButton(actionTarget, favorited);
      showToast(favorited ? `已收藏 ${symbol}` : `已取消收藏 ${symbol}`);
      return;
    }
    if (action === "fill-max") {
      const input = actionTarget.closest(".amount-input")?.querySelector("input");
      if (input) input.value = "185420.80";
      return;
    }
    if (action === "toggle-aime") {
      actionTarget.classList.toggle("is-on");
      aimeEnabled = actionTarget.classList.contains("is-on");
      actionTarget.setAttribute("aria-checked", String(aimeEnabled));
      aimeStorage.set("hufu-ui-aime-enabled", String(aimeEnabled));
      aimeFab.hidden = !aimeEnabled;
      if (aimeEnabled) setAimeCollapsed(true);
      return;
    }
    if (action === "toast") return showToast(actionTarget.dataset.message || "操作已记录");
    showToast("该功能将在独立安全流程中打开");
  });

  document.querySelector("[data-transfer-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    closeModal(false);
    showToast("转账信息已保存，下一步将进行安全核对");
  });

  marketSearch?.addEventListener("submit", (event) => event.preventDefault());
  marketSearchInput?.addEventListener("input", applyMarketSearch);

  document.addEventListener("keydown", (event) => {
    const marketCategoryTab = event.target.closest?.("[data-market-category]");
    if (marketCategoryTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const tabs = [...document.querySelectorAll("[data-market-category]")];
      const currentIndex = tabs.indexOf(marketCategoryTab);
      const nextIndex = getNextMarketTabIndex(currentIndex, tabs.length, event.key);
      selectMarketCategory(tabs[nextIndex], true);
      return;
    }
    if (event.key === "Escape" && marketSearch && !marketSearch.hidden) {
      closeMarketSearch();
      return;
    }
    if (event.key === "Escape" && socialDrawerLayer && !socialDrawerLayer.hidden) {
      closeSocialDrawer(true);
      return;
    }
    trapSocialDrawerFocus(event);
    if (event.key === "Escape") closeModal();
  });

  document.addEventListener("visibilitychange", () => document.hidden ? stopHeroCarousel() : startHeroCarousel());

  const aimeToggle = document.querySelector('[data-action="toggle-aime"]');
  initializeMarketFavorites();
  selectMarketCategory(document.querySelector("[data-market-category].is-active"));
  aimeToggle?.classList.toggle("is-on", aimeEnabled);
  aimeToggle?.setAttribute("aria-checked", String(aimeEnabled));
  aimeFab.hidden = !aimeEnabled;
  setAimeCollapsed(true);
  showHeroSlide(0);
  startHeroCarousel();

  const initialPage = new URLSearchParams(location.hash.slice(1)).get("page");
  const validViews = ["home", "social", "market", "discover", "profile", "settings"];
  const startView = validViews.includes(initialPage) ? initialPage : "home";
  switchView(startView);

  window.addEventListener("hashchange", () => {
    const page = new URLSearchParams(location.hash.slice(1)).get("page");
    const activeView = document.querySelector("[data-view]:not([hidden])");
    const current = activeView?.dataset.view;
    if (page && validViews.includes(page) && page !== current) {
      switchView(page);
    }
  });
})();
