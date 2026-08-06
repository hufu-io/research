(() => {
  const stage = document.querySelector("#aime-preview-stage");
  const buttons = [...document.querySelectorAll("[data-state]")];
  let animation = null;
  const failure = new URLSearchParams(window.location.search).get("failure");
  if (failure === "missing") window.lottie = undefined;
  if (failure === "throw") window.lottie.loadAnimation = () => { throw new Error("AIMe preview failure"); };

  function play(state) {
    const component = window.AimeAnimationComponents.get(state);
    animation?.destroy();
    animation = component.createAnimation({
      container: stage,
      renderer: "svg",
      loop: state === "greeting" ? false : true,
      autoplay: state !== "peek",
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
    });
    if (state === "peek" && animation) {
      animation.addEventListener("DOMLoaded", () => {
        animation.loop = true;
        animation.playSegments(component.segment("peek_loop"), true);
      });
    }
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.state === state)));
  }

  buttons.forEach((button) => button.addEventListener("click", () => play(button.dataset.state)));
  play("idle");
})();
