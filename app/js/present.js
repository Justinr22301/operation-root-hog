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

  function show(n) {
    clearTimeout(timer);
    clearTimeout(typing);
    GAMEAUDIO.stop();
    step = Math.max(-1, Math.min(steps.length, n));
    if (step === -1) {
      root.innerHTML = `<section class="p-card">${plate}<h1>Mission briefing</h1>
        <p>Turn the sound up. Operator Arco will take it from here.</p>
        <button class="btn primary" data-act="begin">Start the briefing</button>
        <p class="help" style="margin-top:3vh">Right arrow or space: next · Left arrow: back · P: pause the voice · F: full screen</p></section>`;
      return;
    }
    if (step === steps.length) {
      root.innerHTML = `<section class="p-card">${plate}<h1>Stand by, agents</h1>
        <p>Your phones will light up when Operator Arco starts the game.</p>
        <p class="help" style="margin-top:3vh"><button class="link" data-act="restart" style="color:#d9d0b3">Play it again</button></p></section>`;
      return;
    }
    const b = steps[step];
    const pic = b.image ? `<img src="${esc(b.image)}" alt="">` : (window.SCENES && SCENES[b.scene]) || "";
    root.innerHTML = `
      <header class="p-top"><strong>STATION ARCO</strong><div class="p-dots">${steps.map((_, i) => `<span class="${i < step ? "on" : i === step ? "here" : ""}"></span>`).join("")}</div></header>
      <div class="p-stage">
        <figure class="scene enter">${pic}</figure>
        <div class="p-words ${esc(b.voice)}"><p class="p-from">From ${esc(b.from)}</p><div class="p-text" id="p-text"></div></div>
      </div>
      <footer class="p-bar"><span>Part ${step + 1} of ${steps.length}</span>
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
      if (here === step && sound) timer = setTimeout(() => show(step + 1), 1500);
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
    if (act === "begin") { sound = true; fullScreen(); return show(0); }
    if (act === "restart") return show(-1);
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
