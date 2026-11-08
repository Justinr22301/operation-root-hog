// The briefing on a big screen, for everyone in the room before the game starts.
// Opened from the game master console. Keys: Right or Space = next, Left = back, P = pause the voice, F = full screen.
(function () {
  const root = document.getElementById("present");
  const steps = GAME.briefing;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let step = -1; // -1 = title card, steps.length = end card
  let sound = true;
  let timer = null;
  let typing = null;
  const collected = []; // scenes already shown, kept as evidence

  // The small pile of captured evidence in the corner; the newest card drops onto it.
  function pile(newest) {
    const shown = collected.slice(-4);
    return `<div class="p-pile" aria-hidden="true">${shown
      .map((s, k) => `<div class="ev mini ${s === newest ? "new" : ""}" style="--r:${[-9, 6, -4, 8][k % 4]}deg">${scenePicture(steps[s])}</div>`)
      .join("")}</div><span class="p-count">${collected.length ? `Evidence collected: ${collected.length}` : ""}</span>`;
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const para = (s) => String(s).split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("");
  const plate = `<div class="plate"><div class="plate-top"><span>ARCO</span><svg class="atom" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6"><ellipse cx="24" cy="24" rx="21" ry="8"/><ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(120 24 24)"/></g><circle cx="24" cy="24" r="4.2" fill="currentColor"/></svg><span>IDAHO</span></div><div class="plate-panel">Operation Root Hog</div></div>`;

  function typeInto(el, text) {
    clearTimeout(typing);
    if (reduceMotion) { el.innerHTML = para(text); return; }
    let i = 0;
    el.classList.add("typing");
    const tick = () => {
      i = Math.min(text.length, i + 2);
      el.textContent = text.slice(0, i);
      if (i < text.length) typing = setTimeout(tick, 28);
      else { el.classList.remove("typing"); el.innerHTML = para(text); }
    };
    tick();
  }

  // Moving on from a scene marked `cut` plays the Bad Guys' hijack first.
  let hijacking = false;
  function show(n) {
    if (hijacking) return;
    if (n === step + 1 && step >= 0 && step < steps.length && steps[step].cut) {
      hijacking = true;
      clearTimeout(timer);
      clearTimeout(typing);
      hijack(root.querySelector(".p-stage .scene"), document.getElementById("p-text"), root.querySelector(".p-words"), () => {
        hijacking = false;
        go(n);
      });
      return;
    }
    go(n);
  }

  function go(n) {
    clearTimeout(timer);
    clearTimeout(typing);
    GAMEAUDIO.stop();
    // Moving forward: the scene we're leaving becomes evidence and flies to the pile.
    const leaving = root.querySelector(".p-stage .scene");
    let fly = null;
    let newest = null;
    if (leaving && n === step + 1 && step >= 0) {
      if (!collected.includes(step)) collected.push(step);
      newest = step;
      fly = { el: leaving.cloneNode(true), from: leaving.getBoundingClientRect() };
    }
    step = Math.max(-1, Math.min(steps.length, n));
    render(newest);
    if (fly && !reduceMotion && step < steps.length) flyToPile(fly);
  }

  function flyToPile({ el, from }) {
    const target = root.querySelector(".p-pile");
    if (!target || !el.animate) return;
    const to = target.getBoundingClientRect();
    el.classList.remove("enter", "hijack");
    el.querySelectorAll(".hijack-noise, .hijack-label").forEach((x) => x.remove());
    el.style.cssText = `position:fixed;left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;margin:0;z-index:50;pointer-events:none`;
    document.body.appendChild(el);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const s = to.width / from.width;
    el.animate(
      [{ transform: "none", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(-10deg)`, opacity: 0.85 }],
      { duration: 650, easing: "cubic-bezier(.5, 0, .3, 1)" }
    ).onfinish = () => el.remove();
  }

  function render(newest) {
    if (step === -1) {
      root.innerHTML = `<section class="p-card">${plate}<h1>Mission briefing</h1>
        <p>Turn the sound up. Operator Arco will take it from here.</p>
        <button class="btn primary" data-act="begin">Start the briefing</button>
        <p class="help" style="margin-top:3vh">Right arrow or space: next · Left arrow: back · P: pause the voice · F: full screen</p></section>`;
      return;
    }
    if (step === steps.length) {
      root.innerHTML = `<section class="p-end">${evidenceBoard(steps)}
        <div class="p-end-words"><h1>Stand by, agents</h1>
        <p>Your phones will light up when Operator Arco starts the game.</p>
        <button class="link" data-act="restart">Play it again</button></div></section>`;
      return;
    }
    const b = steps[step];
    const pic = b.image ? `<img src="${esc(b.image)}" alt="">` : (window.SCENES && SCENES[b.scene]) || "";
    root.innerHTML = `
      <header class="p-top"><strong>STATION ARCO</strong><div class="p-dots">${steps.map((_, i) => `<span class="${i < step ? "on" : i === step ? "here" : ""}"></span>`).join("")}</div></header>
      <div class="p-stage">
        <figure class="scene enter ${steps[step - 1] && steps[step - 1].cut ? "roll" : ""}">${pic}</figure>
        <div class="p-words ${esc(b.voice)}"><p class="p-from">From ${esc(b.from)}</p><div class="p-text" id="p-text"></div></div>
      </div>
      <footer class="p-bar"><div class="p-evidence">${pile(newest)}</div>
        <div class="btns">
          <button class="btn" data-act="back">Back</button>
          <button class="btn" data-act="sound">${sound ? "Pause voice" : "Play voice"}</button>
          <button class="btn primary" data-act="next">Next</button>
          <button class="btn" data-act="full">Full screen</button>
        </div></footer>`;
    typeInto(document.getElementById("p-text"), b.text);
    const prev = steps[step - 1];
    const newSpeaker = !prev || prev.voice !== b.voice;
    if (newSpeaker) GAMEAUDIO.staticBurst(0.9);
    if (sound) {
      const here = step;
      timer = setTimeout(() => speak(here), newSpeaker ? 900 : 300);
    }
  }

  function speak(here) {
    if (here !== step || !sound) return;
    const b = steps[here];
    GAMEAUDIO.play(b.audio, b.text, b.voice, () => {
      if (here === step && sound) timer = setTimeout(() => show(step + 1), b.cut ? 0 : 1500);
    });
  }

  function toggleSound(btn) {
    sound = !sound;
    if (btn) btn.textContent = sound ? "Pause voice" : "Play voice";
    clearTimeout(timer);
    if (sound) speak(step);
    else GAMEAUDIO.stop();
  }

  function fullScreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }

  root.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (!a) return;
    GAMEAUDIO.ensure();
    const act = a.dataset.act;
    if (act === "begin") { sound = true; fullScreen(); return go(0); }
    if (act === "restart") { collected.length = 0; return go(-1); }
    if (act === "next") return show(step + 1);
    if (act === "back") return show(step - 1);
    if (act === "sound") return toggleSound(a);
    if (act === "full") return fullScreen();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); GAMEAUDIO.ensure(); show(step + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(step - 1); }
    else if (e.key === "p" || e.key === "P") toggleSound(root.querySelector('[data-act="sound"]'));
    else if (e.key === "f" || e.key === "F") fullScreen();
  });

  show(-1);
})();
