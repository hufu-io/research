(() => {
  const frame = document.querySelector("#app-frame");
  const overlay = document.querySelector("[data-overlay]");
  const views = [...document.querySelectorAll("[data-view]")];
  const navItems = [...document.querySelectorAll("[data-nav]")];
  const aimeFab = document.querySelector(".aime-fab");
  const aimeStage = document.querySelector(".aime-pet-visual");
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
    views.forEach((view) => {
      const active = view.dataset.view === name;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
      if (active) view.scrollTo({ top: 0, behavior: "instant" });
    });
    navItems.forEach((item) => {
      const active = item.dataset.nav === name;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
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

  function prepareAimeFallback() {
    aimeStage.classList.remove("is-lottie-ready");
  }

  function createAimeAnimation(component, options, token) {
    prepareAimeFallback();
    component.applyFallback(aimeStage);
    try {
      let assetFailed = false;
      const handleImageError = () => {
        assetFailed = true;
        aimeStage.removeEventListener("error", handleImageError, true);
        if (token === aimeAnimationToken) aimeStage.classList.remove("is-lottie-ready");
      };
      aimeStage.addEventListener("error", handleImageError, { capture: true, once: true });
      const animation = component.createAnimation(options);
      if (!animation) return null;
      animation.addEventListener("data_failed", handleImageError);
      animation.addEventListener("loaded_images", () => {
        aimeStage.removeEventListener("error", handleImageError, true);
        if (token === aimeAnimationToken && !assetFailed) aimeStage.classList.add("is-lottie-ready");
      });
      return animation;
    } catch (error) {
      console.warn("AIMe animation fallback active", error);
      return null;
    }
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
    }, token);
    if (onComplete && aimeAnimation) {
      aimeAnimation.addEventListener("complete", () => {
        if (token === aimeAnimationToken) onComplete();
      });
    }
  }

  function loadAimePeekAnimation(token) {
    const component = aimeComponents.get("peek");
    aimeFab.dataset.state = "peek";
    aimeAnimation?.destroy();
    aimeAnimation = createAimeAnimation(component, {
      container: aimeStage,
      renderer: "svg",
      loop: false,
      autoplay: false,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
    }, token);
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
    const nav = event.target.closest("[data-nav]");
    if (nav) return switchView(nav.dataset.nav);

    const viewTarget = event.target.closest("[data-view-target]");
    if (viewTarget) return switchView(viewTarget.dataset.viewTarget);

    const wallet = event.target.closest(".wallet-option");
    if (wallet) return updateWallet(wallet);

    const exclusive = event.target.closest(".segmented-control button, .asset-tabs button, .chain-chips button, .chart-range button, .record-filters button, .state-chips button");
    if (exclusive) {
      [...exclusive.parentElement.children].forEach((item) => item.classList.remove("is-active"));
      exclusive.classList.add("is-active");
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  document.addEventListener("visibilitychange", () => document.hidden ? stopHeroCarousel() : startHeroCarousel());

  const aimeToggle = document.querySelector('[data-action="toggle-aime"]');
  aimeToggle?.classList.toggle("is-on", aimeEnabled);
  aimeToggle?.setAttribute("aria-checked", String(aimeEnabled));
  aimeFab.hidden = !aimeEnabled;
  setAimeCollapsed(true);
  showHeroSlide(0);
  startHeroCarousel();
})();
