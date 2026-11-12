// The briefing on a big screen, for everyone in the room before the game starts.
// Opened from the game master console. Keys: Right or Space = next, Left = back, P = pause the voice, F = full screen.
// briefing.html?finale is the other half: the dark town that lights up when the master switch is thrown.
(function () {
  const root = document.getElementById("present");
  const steps = GAME.briefing;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LINK = window.TVLINK || { teams: async () => [], hijackPhones() {}, onSwitch() {} };
  const FINALE = /[?&]finale\b/.test(location.search);
  let step = -1; // -1 = title card, steps.length = end card
  let sound = true;
  let timer = null;
  let typing = null;
  let extras = []; // timers for one scene's extra effects
  let phonesTaken = false;
  const collected = []; // scenes already shown, kept as evidence
  const threatAt = steps.findIndex((b) => b.scene === "blackout"); // the countdown starts with the threat

  const later = (fn, ms) => { const t = setTimeout(fn, ms); extras.push(t); return t; };
  const clearExtras = () => { extras.forEach(clearTimeout); extras = []; };

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

  function typeInto(el, text, ticks) {
    clearTimeout(typing);
    if (reduceMotion) { el.innerHTML = para(text); return; }
    let i = 0;
    let n = 0;
    el.classList.add("typing");
    const tick = () => {
      i = Math.min(text.length, i + 2);
      el.textContent = text.slice(0, i);
      if (ticks && sound && n++ % 2 === 0 && /\S/.test(text[i - 1] || "")) GAMEAUDIO.tick(0.03);
      if (i < text.length) typing = setTimeout(tick, 28);
      else { el.classList.remove("typing"); el.innerHTML = para(text); }
    };
    tick();
  }

  // ---------- countdown to noon ----------
  function untilNoon() {
    const now = new Date();
    const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    if (now >= noon) noon.setDate(noon.getDate() + 1);
    const s = Math.floor((noon - now) / 1000);
    const two = (n) => String(n).padStart(2, "0");
    return `${Math.floor(s / 3600)}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
  }
  const clock = (fresh) => `<span class="p-clock ${fresh ? "fresh" : ""}">Power cut in <b id="p-clock">${untilNoon()}</b></span>`;
  setInterval(() => { const el = document.getElementById("p-clock"); if (el) el.textContent = untilNoon(); }, 1000);

  // ---------- phones in the room ----------
  function takePhones(on) {
    if (on === phonesTaken) return;
    phonesTaken = on;
    LINK.hijackPhones(on);
  }

  // Moving on from a scene marked `cut` plays the Bad Guys' hijack first.
  let hijacking = false;
  function show(n) {
    if (hijacking) return;
    if (n === step + 1 && step >= 0 && step < steps.length && steps[step].cut) {
      hijacking = true;
      clearTimeout(timer);
      clearTimeout(typing);
      takePhones(true);
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
    clearExtras();
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
    const before = step;
    step = Math.max(-1, Math.min(steps.length, n));
    render(newest, before);
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

  function render(newest, before) {
    root.classList.remove("blackbeat");
    if (step === -1) {
      GAMEAUDIO.hum(false);
      takePhones(false);
      root.innerHTML = `<section class="p-card">${plate}<h1>Mission briefing</h1>
        <p>Turn the sound up. Operator Arco will take it from here.</p>
        <button class="btn primary" data-act="begin">Start the briefing</button>
        <p class="help" style="margin-top:3vh">Right arrow or space: next · Left arrow: back · P: pause the voice · F: full screen</p></section>`;
      return;
    }
    if (step === steps.length) {
      GAMEAUDIO.hum(sound, 0.02);
      takePhones(false);
      const points = GAME.missionPoints || [];
      const after = 0.7 + points.length * 0.45;
      root.innerHTML = `<section class="p-end">
        <div class="p-end-clock">${clock(false)}</div>
        <div class="p-mission"><h2>Your mission</h2>
          <ol>${points.map((p, i) => `<li style="--d:${0.5 + i * 0.45}s">${esc(p)}</li>`).join("")}</ol></div>
        <div class="p-end-words" style="--d:${after}s"><h1>Stand by, agents</h1>
        <p>Your phones will light up when Operator Arco starts the game.</p>
        <div class="p-roll" id="p-roll"></div>
        <p class="p-end-links"><button class="link" data-act="restart">Play it again</button> · <a class="link" href="briefing.html?finale${LINK.mock ? "&mock" : ""}">Finale screen</a></p></div></section>`;
      rollCall((after + 1.6) * 1000);
      return;
    }
    const b = steps[step];
    const pic = b.image ? `<img src="${esc(b.image)}" alt="">` : (window.SCENES && SCENES[b.scene]) || "";
    const threat = threatAt >= 0 && step >= threatAt;
    root.innerHTML = `
      <header class="p-top"><strong>STATION ARCO</strong>${threat ? clock(step === threatAt && before < step) : ""}<div class="p-dots">${steps.map((_, i) => `<span class="${i < step ? "on" : i === step ? "here" : ""}"></span>`).join("")}</div></header>
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
    typeInto(document.getElementById("p-text"), b.text, true);
    takePhones(b.voice === "badguys");
    GAMEAUDIO.hum(sound, b.voice === "badguys" ? 0.05 : 0.035);
    const prev = steps[step - 1];
    const newSpeaker = !prev || prev.voice !== b.voice;
    if (newSpeaker) GAMEAUDIO.staticBurst(0.9);
    // The blackout: the whole screen goes dark for a beat, then the power winds down.
    if (b.scene === "blackout" && !reduceMotion) {
      root.classList.add("blackbeat");
      later(() => root.classList.remove("blackbeat"), 1900);
      if (sound) later(() => GAMEAUDIO.powerDown(3.2, 0.1), 2300);
    }
    if (sound) {
      const here = step;
      timer = setTimeout(() => speak(here), newSpeaker ? 900 : 300);
    }
  }

  // Every family's name, stamped in one at a time.
  async function rollCall(delay) {
    const here = step;
    const names = (await LINK.teams()).map((t) => t.name).filter(Boolean);
    const box = document.getElementById("p-roll");
    if (!box || step !== here || !names.length) return;
    box.innerHTML = `<h3 style="--d:${delay / 1000}s">Agents activated</h3><ul class="${names.length > 8 ? "many" : ""}">${names
      .map((n, i) => `<li style="--d:${delay / 1000 + 0.5 + i * 0.55}s">${esc(n)}</li>`)
      .join("")}</ul>`;
    if (sound && !reduceMotion) names.forEach((_, i) => later(() => GAMEAUDIO.thud(0.35), delay + 500 + i * 550));
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
    if (sound) { GAMEAUDIO.hum(true); speak(step); }
    else { GAMEAUDIO.stop(); GAMEAUDIO.hum(false); }
  }

  function fullScreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }

  // ---------- the finale: a dark town that lights up when the master switch is thrown ----------
  let lit = false;
  function finaleScene() {
    const stars = Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 71) % 320}" cy="${((i * 23) % 60) + 4}" r="${i % 3 ? 0.7 : 1.1}"/>`).join("");
    const bulbs = [70, 130, 190, 250]
      .map((x, i) => `<g class="fin-bulb" style="--d:${i * 0.55}s" transform="translate(${x} 58)">
        <circle r="26" class="glow"/><line y1="-46" y2="-20" stroke="#0c0e12" stroke-width="1.6"/>
        <rect x="-6" y="-22" width="12" height="9" rx="2" fill="#565b66"/><circle r="14" class="glass"/><path d="M-5 3 q5 -10 10 0" class="wire" fill="none" stroke-width="1.4"/></g>`)
      .join("");
    return `<svg class="fin-scene" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="fin-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070c"/><stop offset="1" stop-color="#141b2b"/></linearGradient>
      <linearGradient id="fin-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1a33"/><stop offset="1" stop-color="#3b5488"/></linearGradient></defs>
      <rect width="320" height="180" fill="url(#fin-sky)"/><rect width="320" height="180" fill="url(#fin-day)" class="fin-day"/>
      <g fill="#fff" opacity=".8">${stars}</g>
      <path d="M0 140 Q80 112 160 132 T320 120 V180 H0z" fill="#10141d"/>
      ${window.sceneTown ? sceneTown(168, "fin-win", 2.6, 0.22) : ""}
      <rect y="168" width="320" height="12" fill="#090a0d"/>
      ${bulbs}
    </svg>`;
  }

  function renderFinale(armed) {
    if (!armed) {
      root.innerHTML = `<section class="p-card">${plate}<h1>The finale</h1>
        <p>Leave this on the TV at the Rec Center. It lights up when you throw the master switch in the console.</p>
        <button class="btn primary" data-act="arm">Show the dark town</button>
        <p class="help" style="margin-top:3vh">F: full screen · L: light it by hand if the TV misses the switch</p></section>`;
      return;
    }
    root.innerHTML = `<section class="fin">${finaleScene()}
      <div class="fin-words"><p class="fin-kicker">Station ARCO substation</p>
        <h1 id="fin-title">Master switch locked</h1>
        <p id="fin-sub">Every family opens its padlock. Then the junior agents throw the switch.</p></div>
      <ul class="fin-teams" id="fin-teams"></ul>
      <div class="fin-gobbles" id="fin-gobbles"></div>
      <div class="fin-confetti" id="fin-confetti" aria-hidden="true"></div>
      <button class="link fin-manual" data-act="light">Light it now</button></section>`;
    GAMEAUDIO.hum(true, 0.03);
    showTeams();
    LINK.onSwitch(lightUp);
  }

  async function showTeams() {
    const box = document.getElementById("fin-teams");
    if (!box) return;
    const total = GAME.relays.length + 1;
    const draw = async () => {
      if (lit || !document.getElementById("fin-teams")) return;
      const teams = await LINK.teams();
      box.innerHTML = teams.map((t) => `<li class="${t.restored >= total ? "done" : ""}"><span>${esc(t.name)}</span><b>${Math.min(t.restored, total)} of ${total}</b></li>`).join("");
    };
    draw();
    setInterval(draw, 10000);
  }

  function lightUp() {
    if (lit || !root.querySelector(".fin")) return;
    lit = true;
    const fin = root.querySelector(".fin");
    GAMEAUDIO.hum(false);
    GAMEAUDIO.thud(0.7);
    fin.classList.add("lit");
    [0, 1, 2, 3].forEach((i) => setTimeout(() => { GAMEAUDIO.chime(); }, 300 + i * 550));
    setTimeout(() => {
      document.getElementById("fin-title").textContent = "Power restored";
      document.getElementById("fin-sub").textContent = "Arco is lit. The Peace Summit is back on.";
      const colors = ["#f2c318", "#1c4c9e", "#c1392b", "#e6e3dc"];
      document.getElementById("fin-confetti").innerHTML = Array.from({ length: 60 }, (_, i) =>
        `<i style="left:${(i * 37) % 100}%;background:${colors[i % 4]};--d:${(i % 12) * 0.25}s;--t:${3.5 + (i % 5) * 0.6}s;--r:${(i * 47) % 360}deg"></i>`).join("");
    }, 2600);
    setTimeout(() => {
      const v = GAME.finale.victory;
      document.getElementById("fin-gobbles").innerHTML = `<img src="img/gobbles.webp" alt="Ambassador Gobbles">
        <div class="p-words"><p class="p-from">From ${esc(v.from)}</p><div class="p-text" id="p-text"></div></div>`;
      document.getElementById("fin-gobbles").classList.add("in");
      typeInto(document.getElementById("p-text"), v.text, false);
      GAMEAUDIO.staticBurst(0.6);
      setTimeout(() => GAMEAUDIO.play(v.audio, v.text, "gobbles"), 700);
    }, 5200);
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
    if (act === "arm") { fullScreen(); return renderFinale(true); }
    if (act === "light") return lightUp();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "f" || e.key === "F") return fullScreen();
    if (FINALE) { if (e.key === "l" || e.key === "L") { GAMEAUDIO.ensure(); lightUp(); } return; }
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); GAMEAUDIO.ensure(); show(step + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(step - 1); }
    else if (e.key === "p" || e.key === "P") toggleSound(root.querySelector('[data-act="sound"]'));
  });

  if (FINALE) renderFinale(false);
  else show(-1);
})();
