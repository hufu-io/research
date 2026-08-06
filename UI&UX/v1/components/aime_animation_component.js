(() => {
  const components = new Map();

  class AimeAnimationComponent {
    constructor({ name, animationData, fallbackImage, loop = false }) {
      if (!name || !animationData || !fallbackImage?.startsWith("data:image/png;base64,")) throw new Error("Invalid AIMe animation component");
      this.name = name;
      this.loop = loop;
      this.animationData = animationData;
      this.fallbackImage = fallbackImage;
      this.markers = new Map(
        (animationData.markers || []).map(({ cm, tm, dr }) => [cm, [tm, tm + dr]])
      );
    }

    applyFallback(container) {
      container.classList.remove("is-lottie-ready");
      container.style.setProperty("--aime-fallback-image", `url("${this.fallbackImage}")`);
    }

    createAnimation({ container, renderer = "svg", loop = this.loop, autoplay = true, rendererSettings }) {
      this.applyFallback(container);
      if (!window.lottie?.loadAnimation) return null;
      try {
        let failed = false;
        const animation = window.lottie.loadAnimation({
          container,
          renderer,
          loop,
          autoplay,
          animationData: JSON.parse(JSON.stringify(this.animationData)),
          rendererSettings
        });
        const showAnimation = () => {
          if (!failed) container.classList.add("is-lottie-ready");
        };
        const showFallback = () => {
          failed = true;
          container.classList.remove("is-lottie-ready");
          animation.destroy();
        };
        animation.addEventListener("DOMLoaded", showAnimation);
        animation.addEventListener("data_failed", showFallback);
        return animation;
      } catch {
        return null;
      }
    }

    segment(marker) {
      const segment = this.markers.get(marker);
      if (!segment) throw new Error(`Unknown AIMe marker: ${marker}`);
      return [...segment];
    }
  }

  window.AimeAnimationComponents = Object.freeze({
    register(config) {
      const component = new AimeAnimationComponent(config);
      components.set(component.name, component);
      return component;
    },
    get(name) {
      const component = components.get(name);
      if (!component) throw new Error(`Unknown AIMe animation component: ${name}`);
      return component;
    },
    has(name) {
      return components.has(name);
    },
    names() {
      return [...components.keys()];
    }
  });
})();
