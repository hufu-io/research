(() => {
  const components = new Map();

  class AimeAnimationComponent {
    constructor({ name, animationData, loop = false }) {
      if (!name || !animationData) throw new Error("Invalid AIMe animation component");
      this.name = name;
      this.loop = loop;
      this.animationData = animationData;
      this.markers = new Map(
        (animationData.markers || []).map(({ cm, tm, dr }) => [cm, [tm, tm + dr]])
      );
      this.fallback = animationData.assets?.find(({ p }) => p?.startsWith("data:image/"))?.p || "none";
    }

    applyFallback(container) {
      const value = this.fallback === "none" ? "none" : `url("${this.fallback}")`;
      container.style.setProperty("--aime-fallback-image", value);
    }

    createAnimation({ container, renderer = "svg", loop = this.loop, autoplay = true, rendererSettings }) {
      if (!window.lottie?.loadAnimation) return null;
      return window.lottie.loadAnimation({
        container,
        renderer,
        loop,
        autoplay,
        animationData: JSON.parse(JSON.stringify(this.animationData)),
        rendererSettings
      });
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
