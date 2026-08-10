(() => {
  const frame = document.querySelector("#app-frame");
  const overlay = document.querySelector("[data-overlay]");
  const views = [...document.querySelectorAll("[data-view]")];
  const navItems = [...document.querySelectorAll("[data-nav]")];
  const aimeFab = document.querySelector(".aime-fab");
  const aimeStage = document.querySelector(".aime-pet-visual");
  const aimePetTrigger = document.querySelector(".aime-pet-trigger");
  const aimePanel = document.querySelector('[data-modal="aime"]');
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
  const homeNotice = document.querySelector("[data-home-notice]");
  const homeNoticeTrack = document.querySelector("[data-home-notice-track]");
  const homeNoticeItems = [...document.querySelectorAll("[data-home-notice-item]")];
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const socialDrawerLayer = document.querySelector("[data-social-drawer-layer]");
  const socialDrawer = document.querySelector(".social-drawer");
  const socialDrawerTrigger = document.querySelector("[data-social-drawer-trigger]");
  const socialSearch = document.querySelector("[data-social-search]");
  const socialSearchInput = document.querySelector("[data-social-search-input]");
  const socialSearchClear = document.querySelector("[data-action='clear-social-search']");
  const socialFilterTabs = [...document.querySelectorAll("[data-social-filter]")];
  const socialChatEmpty = document.querySelector("[data-social-chat-empty]");
  const marketAppbar = document.querySelector(".market-appbar");
  const marketSearch = document.querySelector("[data-market-search]");
  const marketSearchInput = document.querySelector("[data-market-search-input]");
  const marketSearchClear = document.querySelector("[data-action='clear-market-search']");
  const marketSearchEmpty = document.querySelector("[data-market-search-empty]");
  const marketCard = document.querySelector(".market-card-flat");
  const marketSearchTrigger = document.querySelector("[data-action='open-market-search']");
  const marketViewTabs = [...document.querySelectorAll("[data-market-view-tab]")];
  const marketViewPanels = [...document.querySelectorAll("[data-market-view-panel]")];
  const marketPage = document.querySelector('[data-view="market"]');
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
  let aimePointerStartY = 0;
  let aimeDragOriginLeft = 0;
  let aimeDragOriginTop = 0;
  let aimeDragging = false;
  let aimeLongPressed = false;
  let aimePositioned = false;
  let aimeDockedRight = true;
  let aimeRightBoundaryExceeded = false;
  let aimeThinkingTimer = null;
  let aimeLongPressTimer = null;
  let heroIndex = 0;
  let heroTimer = null;
  let homeNoticeIndex = 0;
  let homeNoticeVisualIndex = 0;
  let homeNoticeTimer = null;
  let pendingDapp = null;
  let marketSortKey = "";
  let marketSortDirection = "none";
  let marketFavorites = new Set();
  let marketActiveCategory = "self";
  let marketActiveView = "quotes";
  let socialActiveFilter = "all";
  const marketViewScroll = { quotes: 0, news: 0 };
  const launchLoading = document.querySelector("[data-launch-loading]");
  const launchLoadingStage = document.querySelector("[data-launch-loading-animation]");
  let launchLoadingAnimation = null;

  function initializeLaunchLoading() {
    if (!launchLoading) return;
    frame.setAttribute("aria-busy", "true");
    document.documentElement.dataset.launchState = "loading";
    if (window.lottie?.loadAnimation && window.TigerLoadingAnimationData && launchLoadingStage) {
      try {
        launchLoadingAnimation = window.lottie.loadAnimation({
          container: launchLoadingStage,
          renderer: "svg",
          loop: true,
          autoplay: !reducedMotionQuery.matches,
          animationData: window.TigerLoadingAnimationData,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
        });
        if (reducedMotionQuery.matches) launchLoadingAnimation.goToAndStop(0, true);
      } catch {
        launchLoadingAnimation = null;
      }
    }

    const finish = () => {
      launchLoading.hidden = true;
      frame.setAttribute("aria-busy", "false");
      document.documentElement.dataset.launchState = "ready";
      launchLoadingAnimation?.destroy();
      launchLoadingAnimation = null;
    };

    window.setTimeout(() => {
      document.documentElement.dataset.launchState = "leaving";
      launchLoading.classList.add("is-leaving");
      launchLoading.addEventListener("transitionend", finish, { once: true });
      window.setTimeout(finish, 240);
    }, 1000);
  }

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
    const storedValue = aimeStorage.get("hufu-ui-market-favorites");
    if (storedValue == null) {
      marketFavorites = new Set(getMarketRows().map((row) => row.dataset.marketSymbol).filter(Boolean));
      saveMarketFavorites();
      return;
    }
    try {
      const stored = JSON.parse(storedValue);
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
    button.classList.toggle("is-favorite", favorited && marketActiveCategory === "self");
    button.setAttribute("aria-pressed", String(favorited));
    button.setAttribute("aria-label", `${favorited ? "取消收藏" : "收藏"} ${symbol}`);
  }

  function updateMarketFavoriteButtons() {
    document.querySelectorAll(".market-favorite").forEach((button) => {
      updateMarketFavoriteButton(button, marketFavorites.has(button.dataset.symbol));
    });
  }

  function initializeMarketFavorites() {
    readMarketFavorites();
    updateMarketFavoriteButtons();
  }

  function applyMarketSearch() {
    const query = marketSearchInput?.value.trim().toLocaleLowerCase() || "";
    let visibleCount = 0;
    getMarketRows().forEach((row) => {
      const searchable = `${row.dataset.marketSymbol || ""} ${row.dataset.marketName || ""}`.toLocaleLowerCase();
      const categoryMatches = marketActiveCategory === "self"
        ? marketFavorites.has(row.dataset.marketSymbol)
        : row.dataset.marketCategory === marketActiveCategory;
      const queryMatches = !query || searchable.includes(query);
      const visible = categoryMatches && queryMatches;
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    if (marketSearchClear) marketSearchClear.hidden = !query;
    if (marketSearchEmpty) {
      marketSearchEmpty.textContent = query
        ? "未找到相关币种，请尝试其他关键词"
        : marketActiveCategory === "self"
          ? "暂无自选币种，可前往 FullOn 或主流币添加"
          : "当前分类暂无行情";
      marketSearchEmpty.hidden = visibleCount > 0;
    }
  }

  function selectMarketCategory(tab, moveFocus = false) {
    if (!tab) return;
    marketActiveCategory = tab.dataset.marketCategory || "self";
    document.querySelectorAll('[role="tab"][data-market-category]').forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    updateMarketFavoriteButtons();
    applyMarketSearch();
    if (moveFocus) tab.focus();
  }

  function getSocialChatRows() {
    return [...document.querySelectorAll("[data-chat-row]")];
  }

  function applySocialChatFilter() {
    const query = socialSearchInput?.value.trim().toLocaleLowerCase() || "";
    let visibleCount = 0;
    getSocialChatRows().forEach((row) => {
      const categoryMatches = socialActiveFilter === "all" || row.dataset.chatCategory === socialActiveFilter;
      const searchable = row.dataset.chatSearch?.toLocaleLowerCase() || "";
      const queryMatches = !query || searchable.includes(query);
      const visible = categoryMatches && queryMatches;
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    if (socialSearchClear) socialSearchClear.hidden = !query;
    if (socialChatEmpty) socialChatEmpty.hidden = visibleCount > 0;
  }

  function selectSocialFilter(tab, moveFocus = false) {
    if (!tab) return;
    socialActiveFilter = tab.dataset.socialFilter || "all";
    socialFilterTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    applySocialChatFilter();
    if (moveFocus) tab.focus();
  }

  function clearSocialSearch() {
    if (!socialSearchInput) return;
    socialSearchInput.value = "";
    applySocialChatFilter();
    socialSearchInput.focus();
  }

  function toggleMarketFavorite(button) {
    const symbol = button.dataset.symbol;
    const favorited = !marketFavorites.has(symbol);
    if (favorited) marketFavorites.add(symbol);
    else marketFavorites.delete(symbol);
    saveMarketFavorites();
    updateMarketFavoriteButton(button, favorited);
    applyMarketSearch();
    showToast(favorited ? `已收藏 ${symbol}` : `已取消收藏 ${symbol}`);
  }

  function getNextMarketTabIndex(currentIndex, tabCount, key) {
    if (key === "Home") return 0;
    if (key === "End") return tabCount - 1;
    return (currentIndex + (key === "ArrowRight" ? 1 : -1) + tabCount) % tabCount;
  }

  function selectMarketView(tab, moveFocus = false) {
    if (!tab) return;
    const nextView = tab.dataset.marketViewTab || "quotes";
    if (marketPage) marketViewScroll[marketActiveView] = marketPage.scrollTop;
    if (nextView === "news" && marketSearch && !marketSearch.hidden) closeMarketSearch(false);
    marketViewTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    marketViewPanels.forEach((panel) => {
      panel.hidden = panel.dataset.marketViewPanel !== nextView;
    });
    marketActiveView = nextView;
    marketAppbar?.classList.toggle("is-news-view", nextView === "news");
    requestAnimationFrame(() => {
      if (marketPage) marketPage.scrollTop = marketViewScroll[nextView] || 0;
    });
    if (moveFocus) tab.focus();
  }

  function openMarketSearch() {
    if (!marketSearch || marketActiveView !== "quotes") return;
    marketAppbar?.classList.add("is-searching");
    marketSearch.hidden = false;
    requestAnimationFrame(() => marketSearchInput?.focus());
  }

  function clearMarketSearch(focusInput = true) {
    if (!marketSearchInput) return;
    marketSearchInput.value = "";
    applyMarketSearch();
    if (focusInput) marketSearchInput.focus();
  }

  function closeMarketSearch(restoreFocus = true) {
    if (!marketSearch) return;
    clearMarketSearch(false);
    marketSearch.hidden = true;
    marketAppbar?.classList.remove("is-searching");
    if (restoreFocus) marketSearchTrigger?.focus();
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

  function showHomeNotice(index) {
    if (!homeNotice || !homeNoticeTrack || !homeNoticeItems.length) return;
    const nextIndex = (index + homeNoticeItems.length) % homeNoticeItems.length;
    const loopsToStart = homeNoticeIndex === homeNoticeItems.length - 1 && nextIndex === 0 && index > homeNoticeIndex;
    homeNoticeIndex = nextIndex;
    homeNoticeVisualIndex = loopsToStart ? homeNoticeItems.length : homeNoticeIndex;
    homeNoticeTrack.style.setProperty("--notice-index", homeNoticeVisualIndex);
    const message = homeNoticeItems[homeNoticeIndex].textContent.trim();
    homeNotice.setAttribute("aria-label", `查看通知：${message}`);
  }

  function resetHomeNoticeTrack() {
    if (!homeNoticeTrack || homeNoticeVisualIndex !== homeNoticeItems.length) return;
    homeNoticeTrack.classList.add("is-resetting");
    homeNoticeVisualIndex = 0;
    homeNoticeTrack.style.setProperty("--notice-index", homeNoticeVisualIndex);
    requestAnimationFrame(() => requestAnimationFrame(() => homeNoticeTrack.classList.remove("is-resetting")));
  }

  function stopHomeNoticeTicker() {
    window.clearInterval(homeNoticeTimer);
    homeNoticeTimer = null;
    resetHomeNoticeTrack();
  }

  function startHomeNoticeTicker() {
    stopHomeNoticeTicker();
    const homeView = document.querySelector('[data-view="home"]');
    if (!homeNotice || homeNoticeItems.length < 2 || document.hidden || homeView?.hidden || reducedMotionQuery.matches) return;
    homeNoticeTimer = window.setInterval(() => showHomeNotice(homeNoticeIndex + 1), 3000);
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
    if (name === "home") startHomeNoticeTicker();
    else stopHomeNoticeTicker();
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
    const closingModal = activeModal;
    closingModal.hidden = true;
    overlay.hidden = true;
    activeModal = null;
    if (closingModal === aimePanel) setAimePanelExpanded(false);
    if (restoreFocus && returnFocus instanceof HTMLElement) returnFocus.focus();
  }

  function setAimePanelExpanded(expanded) {
    if (!aimePanel) return;
    const expandButton = aimePanel.querySelector("[data-aime-expand]");
    const expandIcon = aimePanel.querySelector("[data-aime-expand-icon]");
    aimePanel.classList.toggle("is-full", expanded);
    expandButton?.setAttribute("aria-pressed", String(expanded));
    expandButton?.setAttribute("aria-label", expanded ? "收起为半屏对话" : "展开完整对话");
    expandIcon?.setAttribute("href", expanded ? "#i-collapse" : "#i-expand");
  }

  function openAimePanel(trigger) {
    const activeView = document.querySelector("[data-view]:not([hidden])")?.dataset.view || "home";
    const labels = {
      home: "Hufu 首页",
      social: "社交",
      market: "市场",
      discover: "发现",
      profile: "我的",
      settings: "设置"
    };
    const context = aimePanel?.querySelector("[data-aime-context]");
    if (context) context.textContent = labels[activeView] || "当前页面";
    setAimePanelExpanded(false);
    return openModal("aime", trigger);
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

  function addAimeMessage(text, user = false, pending = false) {
    const messages = aimePanel?.querySelector(".aime-messages");
    if (!messages) return null;
    const wrapper = document.createElement("div");
    wrapper.className = `message ${user ? "user-message" : "aime-message"}${pending ? " pending-message" : ""}`;
    if (!user) {
      const avatar = document.createElement("span");
      avatar.className = "aime-message-avatar";
      avatar.textContent = "Ai";
      avatar.setAttribute("aria-hidden", "true");
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
    const network = document.querySelector(".wallet-network")?.textContent.trim() || "当前";
    const wallet = document.querySelector(".wallet-name")?.textContent.trim() || "当前钱包";
    const answers = {
      "FullSwap 是什么？": "FullSwap 是 FullOn 生态的去中心化兑换入口。打开前请确认官方域名 fullswap.flon.network，连接、授权和交易仍需逐步确认。",
      "如何安全跨链？": "先核对源链、目标链、资产、接收账户和预计到账数量。异常授权、网络不匹配或域名错误时应立即停止。",
      "解释当前网络": `当前是 ${network} 网络和${wallet}。切换钱包后，资产、行情、DApp 和后续签名上下文会同步更新。`
    };
    addAimeMessage(question, true);
    const pending = addAimeMessage("正在结合当前页面整理…", false, true);
    window.setTimeout(() => {
      pending?.remove();
      addAimeMessage(answers[question] || "我已整理操作路径。原型只提供说明，不会替你连接钱包、签名或发起交易。", false);
    }, 420);
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
    aimePetTrigger?.setAttribute("aria-label", collapsed ? "展开 Aime 智能助手" : "与 Aime 宠物互动");
    aimePetTrigger?.setAttribute("title", collapsed ? "点击展开 Aime" : "点击与 Aime 宠物互动");
    if (aimePositioned && aimeDockedRight) window.requestAnimationFrame(snapAimeToRightEdge);
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

  function getAimeDragBounds() {
    const frameRect = frame.getBoundingClientRect();
    const fabRect = aimeFab.getBoundingClientRect();
    const navigationTop = bottomNav?.getBoundingClientRect().top || frameRect.bottom;
    const minLeft = frameRect.left + 12;
    const maxLeft = Math.max(minLeft, frameRect.right - fabRect.width - 12);
    const minTop = frameRect.top + 12;
    const maxTop = Math.max(minTop, navigationTop - fabRect.height - 12);
    return { minLeft, maxLeft, minTop, maxTop };
  }

  function clampAimePosition(left, top) {
    const bounds = getAimeDragBounds();
    return {
      left: Math.max(bounds.minLeft, Math.min(bounds.maxLeft, left)),
      top: Math.max(bounds.minTop, Math.min(bounds.maxTop, top))
    };
  }

  function renderAimePosition(left, top) {
    aimePositioned = true;
    aimeFab.classList.add("is-positioned");
    aimeFab.style.left = `${left}px`;
    aimeFab.style.top = `${top}px`;
    aimeFab.style.right = "auto";
    aimeFab.style.bottom = "auto";
  }

  function setAimePosition(left, top) {
    const position = clampAimePosition(left, top);
    renderAimePosition(position.left, position.top);
  }

  function getAimeTargetWidth(collapsed) {
    const property = collapsed ? "--aime-collapsed-width" : "--aime-expanded-width";
    const width = Number.parseFloat(window.getComputedStyle(aimeFab).getPropertyValue(property));
    return Number.isFinite(width) ? width : aimeFab.getBoundingClientRect().width;
  }

  function snapAimeToRightEdge() {
    const frameRect = frame.getBoundingClientRect();
    const bounds = getAimeDragBounds();
    const rect = aimeFab.getBoundingClientRect();
    const targetWidth = getAimeTargetWidth(aimeCollapsed);
    const targetLeft = aimeCollapsed ? frameRect.right - targetWidth : frameRect.right - targetWidth - 12;
    const top = Math.max(bounds.minTop, Math.min(bounds.maxTop, rect.top));
    renderAimePosition(Math.max(bounds.minLeft, targetLeft), top);
  }

  function settleAimeRight() {
    aimeDockedRight = true;
    setAimeCollapsed(false);
    snapAimeToRightEdge();
  }

  function dockAimeRight() {
    aimeDockedRight = true;
    setAimeCollapsed(true);
    snapAimeToRightEdge();
  }

  aimeFab.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.("[data-aime-bubble]")) return;
    if (!event.isPrimary || event.button > 0 || aimePointerId !== null) return;
    aimePointerId = event.pointerId;
    aimePointerStartX = event.clientX;
    aimePointerStartY = event.clientY;
    const rect = aimeFab.getBoundingClientRect();
    aimeDragOriginLeft = rect.left;
    aimeDragOriginTop = rect.top;
    aimeDragging = false;
    aimeLongPressed = false;
    aimeRightBoundaryExceeded = false;
    aimeFab.setPointerCapture(event.pointerId);
    aimeFab.classList.add("is-dragging");
    aimeThinkingTimer = window.setTimeout(() => {
      if (!aimeDragging && !aimeCollapsed) playAimeState("thinking");
    }, 160);
    aimeLongPressTimer = window.setTimeout(() => {
      aimeLongPressed = true;
      dockAimeRight();
    }, 620);
  });

  aimeFab.addEventListener("pointermove", (event) => {
    if (event.pointerId !== aimePointerId) return;
    const distanceX = event.clientX - aimePointerStartX;
    const distanceY = event.clientY - aimePointerStartY;
    if (Math.hypot(distanceX, distanceY) <= 6 && !aimeDragging) return;
    aimeDragging = true;
    clearAimePressTimers();
    const rawLeft = aimeDragOriginLeft + distanceX;
    aimeRightBoundaryExceeded = rawLeft > getAimeDragBounds().maxLeft;
    aimeDockedRight = false;
    setAimePosition(rawLeft, aimeDragOriginTop + distanceY);
  });

  aimeFab.addEventListener("pointerup", (event) => {
    if (event.pointerId !== aimePointerId) return;
    clearAimePressTimers();
    const wasDragging = aimeDragging;
    const wasLongPressed = aimeLongPressed;
    const shouldDockRight = aimeRightBoundaryExceeded;
    aimeFab.classList.remove("is-dragging");
    aimeFab.releasePointerCapture(event.pointerId);
    aimePointerId = null;
    aimeRightBoundaryExceeded = false;

    if (wasLongPressed) return;
    if (wasDragging) {
      if (shouldDockRight) dockAimeRight();
      else settleAimeRight();
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
    const shouldDockRight = aimeRightBoundaryExceeded;
    aimeFab.classList.remove("is-dragging");
    aimePointerId = null;
    aimeRightBoundaryExceeded = false;
    if (shouldDockRight) dockAimeRight();
    else settleAimeRight();
    if (aimeCollapsed) playAimePeek();
    else playAimeState("idle");
  });

  aimeFab.addEventListener("click", (event) => event.preventDefault());

  aimeFab.addEventListener("transitionend", (event) => {
    if (event.target !== aimeFab || event.propertyName !== "width" || !aimePositioned || !aimeDockedRight) return;
    snapAimeToRightEdge();
  });

  window.addEventListener("resize", () => {
    if (!aimePositioned) return;
    if (aimeDockedRight) {
      snapAimeToRightEdge();
      return;
    }
    const rect = aimeFab.getBoundingClientRect();
    setAimePosition(rect.left, rect.top);
  });

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
    if (viewTarget) {
      switchView(viewTarget.dataset.viewTarget);
      if (viewTarget.hasAttribute("data-market-open-news")) selectMarketView(document.querySelector('[data-market-view-tab="news"]'));
      return;
    }

    const wallet = event.target.closest(".wallet-option");
    if (wallet) return updateWallet(wallet);

    const marketSortButton = event.target.closest("[data-market-sort]");
    if (marketSortButton) return sortMarketRows(marketSortButton);

    const marketCategoryTab = event.target.closest('[role="tab"][data-market-category]');
    if (marketCategoryTab) return selectMarketCategory(marketCategoryTab);

    const socialFilterTab = event.target.closest("[data-social-filter]");
    if (socialFilterTab) return selectSocialFilter(socialFilterTab);

    const aimePrompt = event.target.closest("[data-aime-prompt]");
    if (aimePrompt) return answerAime(aimePrompt.dataset.aimePrompt);

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
    if (action === "open-aime") return openAimePanel(actionTarget);
    if (action === "toggle-aime-full") {
      setAimePanelExpanded(!aimePanel?.classList.contains("is-full"));
      return;
    }
    if (action === "minimize-aime") return closeModal();
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
    if (action === "clear-social-search") return clearSocialSearch();
    if (action === "toggle-market-favorite") return toggleMarketFavorite(actionTarget);
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

  document.querySelector("[data-aime-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.message;
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    answerAime(value);
  });

  marketSearch?.addEventListener("submit", (event) => event.preventDefault());
  marketSearchInput?.addEventListener("input", applyMarketSearch);
  socialSearch?.addEventListener("submit", (event) => event.preventDefault());
  socialSearchInput?.addEventListener("input", applySocialChatFilter);
  marketViewTabs.forEach((tab) => tab.addEventListener("click", () => selectMarketView(tab)));

  document.addEventListener("keydown", (event) => {
    const marketViewTab = event.target.closest?.("[data-market-view-tab]");
    if (marketViewTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const currentIndex = marketViewTabs.indexOf(marketViewTab);
      const nextIndex = getNextMarketTabIndex(currentIndex, marketViewTabs.length, event.key);
      selectMarketView(marketViewTabs[nextIndex], true);
      return;
    }
    const marketCategoryTab = event.target.closest?.('[role="tab"][data-market-category]');
    if (marketCategoryTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const tabs = [...document.querySelectorAll('[role="tab"][data-market-category]')];
      const currentIndex = tabs.indexOf(marketCategoryTab);
      const nextIndex = getNextMarketTabIndex(currentIndex, tabs.length, event.key);
      selectMarketCategory(tabs[nextIndex], true);
      return;
    }
    const socialFilterTab = event.target.closest?.("[data-social-filter]");
    if (socialFilterTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const currentIndex = socialFilterTabs.indexOf(socialFilterTab);
      const nextIndex = getNextMarketTabIndex(currentIndex, socialFilterTabs.length, event.key);
      selectSocialFilter(socialFilterTabs[nextIndex], true);
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

  homeNotice?.addEventListener("pointerenter", stopHomeNoticeTicker);
  homeNotice?.addEventListener("pointerleave", startHomeNoticeTicker);
  homeNotice?.addEventListener("focus", stopHomeNoticeTicker);
  homeNotice?.addEventListener("blur", startHomeNoticeTicker);
  homeNoticeTrack?.addEventListener("transitionend", resetHomeNoticeTrack);
  reducedMotionQuery.addEventListener("change", () => reducedMotionQuery.matches ? stopHomeNoticeTicker() : startHomeNoticeTicker());

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopHeroCarousel();
      stopHomeNoticeTicker();
      return;
    }
    startHeroCarousel();
    startHomeNoticeTicker();
  });

  const aimeToggle = document.querySelector('[data-action="toggle-aime"]');
  initializeLaunchLoading();
  initializeMarketFavorites();
  selectMarketView(document.querySelector("[data-market-view-tab].is-active"));
  selectMarketCategory(document.querySelector('[role="tab"][data-market-category].is-active'));
  selectSocialFilter(document.querySelector("[data-social-filter].is-active"));
  aimeToggle?.classList.toggle("is-on", aimeEnabled);
  aimeToggle?.setAttribute("aria-checked", String(aimeEnabled));
  aimeFab.hidden = !aimeEnabled;
  setAimeCollapsed(true);
  showHeroSlide(0);
  showHomeNotice(0);
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
