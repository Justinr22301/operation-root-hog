// Operation Root Hog: the family app.
(function () {
  const STORE = "roothog.state.v1";
  const backend = makeBackend();
  const app = document.getElementById("app");
  const overlay = document.getElementById("overlay");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- state ----------
  let S = load();
  let view = { name: "start" };
  let typingTimer = null;
  let narrate = false; // briefing read aloud scene by scene, turned on by a tap (phones need one before sound)
  let briefTimer = null;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s) return s;
    } catch (e) { /* ignore */ }
    return fresh();
  }
  function fresh() {
    return { code: null, team: null, started: false, progress: {}, briefingDone: false, digits: "", quiz: [], quizDone: false, switchThrown: false, settings: { navigator: true, tracking: false, showAnswers: false }, queue: [] };
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }

  // ---------- helpers ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const para = (s) => String(s).split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("");
  const relayById = (id) => (id === "family" ? GAME.family : GAME.relays.find((r) => r.id === id));
  const prog = (id) => (S.progress[id] = S.progress[id] || { stage: "find", hints: 0, map: false, main: false, junior: false, juniorTries: 0, typed: false });
  const allIds = () => S.team.route.concat("family");
  // Whole days from today to a "YYYY-MM-DD" date, by this phone's calendar.
  const daysUntil = (ymd) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const now = new Date();
    return Math.round((new Date(y, m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  };
  // A stop's name stays hidden ("Station 3") until the family taps "We're here".
  const revealed = (id) => id === "family" || (S.progress[id] && S.progress[id].stage !== "find");
  const label = (id) => (revealed(id) ? relayById(id).name : `Station ${S.team.route.indexOf(id) + 1}`);
  const shortLabel = (id) => (revealed(id) ? relayById(id).name.replace(" Relay", "") : label(id));
  const restoredIds = () => allIds().filter((id) => S.progress[id] && S.progress[id].stage === "restored");
  const restoredPlaces = () => S.team.route.filter((id) => S.progress[id] && S.progress[id].stage === "restored").length;
  const familyUnlocked = () => restoredPlaces() >= GAME.family.unlockAfter;
  const allDone = () => restoredIds().length === allIds().length;
  const nextPlace = () => S.team.route.find((id) => !S.progress[id] || S.progress[id].stage !== "restored");
  const demoAnswer = (id, kind) => (window.DEMO_ANSWERS && S.settings.showAnswers ? (id === "kickoff" ? DEMO_ANSWERS.kickoff : (DEMO_ANSWERS.relays[id] || {})[kind]) : null);

  function score() {
    const sc = GAME.scoring;
    let total = 0;
    for (const id of allIds()) {
      const p = S.progress[id];
      if (!p) continue;
      total += p.hints * sc.hint + (p.map ? sc.map : 0);
      if (p.stage === "restored") total += sc.relay + (p.juniorFirstTry ? sc.juniorFirstTry : 0);
    }
    return total;
  }

  const ATOM = `<svg class="atom" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6"><ellipse cx="24" cy="24" rx="21" ry="8"/><ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(120 24 24)"/></g><circle cx="24" cy="24" r="4.2" fill="currentColor"/></svg>`;
  const ICONS = {
    torpedo: `<svg viewBox="0 0 120 48" aria-hidden="true"><path d="M14 24c0-7 6-11 14-11h62l14 11-14 11H28c-8 0-14-4-14-11z" fill="currentColor"/><path d="M90 13l12-9v40l-12-9" fill="currentColor"/></svg>`,
    anchor: `<svg viewBox="0 0 120 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><circle cx="60" cy="10" r="6"/><path d="M60 16v42M44 26h32M30 40c4 12 16 18 30 18s26-6 30-18"/></g></svg>`,
    tower: `<svg viewBox="0 0 120 64" aria-hidden="true"><path d="M44 60V18c0-8 6-14 16-14s16 6 16 14v42z" fill="currentColor"/><rect x="30" y="56" width="60" height="6" rx="2" fill="currentColor"/></svg>`,
  };

  function wordmark(small) {
    return `<div class="plate${small ? " plate-small" : ""}" role="img" aria-label="Arco Idaho sign">
      <div class="plate-top"><span>ARCO</span>${ATOM}<span>IDAHO</span></div>
      <div class="plate-panel">${small ? "Station ARCO" : "Operation Root Hog"}</div>
    </div>`;
  }

  function topbar(back) {
    return `<header class="topbar">
      ${back ? (S.started ? `<button class="link" data-action="board">Relay board</button>` : `<button class="link" data-action="home">Back</button>`) : `<span class="team-name">${esc(S.team.name)}</span>`}
      <span class="score" aria-label="Score">${score()} points</span>
      <button class="link" data-action="settings" aria-label="Settings">Settings</button>
    </header>`;
  }

  function typeInto(el, text, done) {
    clearTimeout(typingTimer);
    if (reduceMotion || !el) { if (el) el.innerHTML = para(text); if (done) done(); return; }
    let i = 0;
    el.textContent = "";
    el.classList.add("typing");
    const skip = () => { i = text.length; };
    el.addEventListener("click", skip, { once: true });
    const step = () => {
      i = Math.min(text.length, i + 2);
      el.textContent = text.slice(0, i);
      if (i < text.length) typingTimer = setTimeout(step, 22);
      else { el.classList.remove("typing"); el.innerHTML = para(text); if (done) done(); }
    };
    step();
  }

  function toast(msg, kind) {
    document.querySelectorAll(".toast").forEach((old) => old.remove());
    const t = document.createElement("div");
    t.className = `toast ${kind || ""}`;
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  // ---------- navigation ----------
  function go(name, extra) {
    view = Object.assign({ name }, extra || {});
    GAMEAUDIO.stop();
    render();
    window.scrollTo(0, 0);
    const h = app.querySelector("h1, h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  function home() {
    if (!S.team) return go("start");
    if (!S.started) return go("waiting");
    if (allDone()) return go("finale");
    return go("board");
  }

  function render() {
    const fn = SCREENS[view.name] || SCREENS.start;
    app.innerHTML = fn();
    if (AFTER[view.name]) AFTER[view.name]();
  }

  // ---------- screens ----------
  const SCREENS = {
    start() {
      const days = daysUntil(GAME.gameDay.date);
      return `<section class="screen start">
        ${wordmark(false)}
        <p class="intercept"><span>Intercepted transmission</span>The Bad Guys are back, and this Thanksgiving they're after Arco's lights.</p>
        <figure class="poster">
          <div class="poster-photo"><img src="img/gobbles.webp" alt="Ambassador Gobbles, a turkey in a top hat and a blue sash, waving"></div>
          <figcaption><strong>Ambassador Gobbles</strong> is counting on you.</figcaption>
        </figure>
        <button class="link backstory-link" data-action="backstory">Who are the Bad Guys? What happened in 2024?</button>
        <dl class="mission-facts">
          <div style="--i:0"><dt>When</dt><dd>Thanksgiving morning, Thursday, November 26${days > 0 ? ` (${days === 1 ? "tomorrow" : `${days} days away`})` : ""}. We start together at the Arco Rec Center.</dd></div>
          <div style="--i:1"><dt>What</dt><dd>Your family drives between real places in Arco and Moore, cracking clues to bring Station ARCO's radio relays back on.</dd></div>
          <div style="--i:2"><dt>Who</dt><dd>Everyone in the car. Junior agents get puzzles of their own.</dd></div>
        </dl>
        <p class="help">Sign up once per family. After that, anyone else in your family can join the same team on their own phone with your team code, and every phone follows the family's progress.</p>
        <div class="stack">
          <button class="btn primary" data-action="signup">Sign up your family</button>
          <button class="btn" data-action="join">Join your family's team</button>
        </div>
        ${backend.kind === "demo" ? `<p class="note">Demo mode: this phone keeps everything to itself. Nothing is sent anywhere.</p>` : ""}
      </section>`;
    },

    signup() {
      return `<section class="screen">
        <button class="link back" data-action="start">Back</button>
        <h1>Sign up your family</h1>
        <form id="signup" class="form" novalidate>
          <label class="field"><span>Team name</span><input name="name" required maxlength="40" autocomplete="off" placeholder="The Rose Family"></label>

          <fieldset class="field"><legend>Agents riding along</legend>
            <p class="help">First names and ages. Agents under 8 get Junior Agent puzzles.</p>
            <div id="agents"></div>
            <button type="button" class="btn small" data-action="add-agent">Add another agent</button>
          </fieldset>

          <fieldset class="field"><legend>Clue level</legend>
            <label class="choice"><input type="radio" name="level" value="agent" checked><span><strong>Agent.</strong> Most of our agents are 12 or younger.</span></label>
            <label class="choice"><input type="radio" name="level" value="senior"><span><strong>Senior Agent.</strong> We have teenagers who want it harder.</span></label>
          </fieldset>

          <fieldset class="field"><legend>For your Family Relay</legend>
            <p class="help">Only the game master sees these. One clue will be written just for your family.</p>
            <label class="field"><span>Year the parents were married</span><input name="weddingYear" inputmode="numeric" maxlength="4"></label>
            <label class="field"><span>A pet's name, now or from the past</span><input name="pet" maxlength="40"></label>
            <label class="field"><span>Favorite family book, movie, or game</span><input name="favorite" maxlength="60"></label>
            <label class="field"><span>A place you've lived or love to visit</span><input name="place" maxlength="60"></label>
            <label class="field"><span>Something your kids know that other families wouldn't</span><textarea name="secret" rows="2" maxlength="200"></textarea></label>
          </fieldset>

          <label class="choice"><input type="checkbox" name="tracking" checked><span>Share our location with the game master during the game, so he can send help if we get stuck. It's deleted afterward.</span></label>

          <p class="error" id="signup-error" role="alert"></p>
          <button class="btn primary" type="submit">Create our team</button>
        </form>
      </section>`;
    },

    join() {
      return `<section class="screen">
        <button class="link back" data-action="start">Back</button>
        <h1>Join your family's team</h1>
        <form id="join" class="form">
          <label class="field"><span>Team code</span><input name="code" required maxlength="6" autocomplete="off" autocapitalize="characters" class="code-input" placeholder="ABC123"></label>
          <p class="error" id="join-error" role="alert"></p>
          <button class="btn primary" type="submit">Join team</button>
        </form>
      </section>`;
    },

    // Families sign up ahead of time. Their phones wait here until the game master starts the game.
    waiting() {
      const days = daysUntil(GAME.gameDay.date);
      const when = days > 1 ? `${days} days to go` : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Any minute now";
      return `${topbar(false)}<section class="screen waiting">
        ${wordmark(true)}
        <h1>You're signed up</h1>
        <p class="countdown">${esc(when)}</p>
        <p class="lede">${esc(GAME.gameDay.where)}</p>
        <div class="code-card">
          <p>Your team code</p>
          <p class="code-big" aria-label="Team code">${esc(S.code.split("").join(" "))}</p>
          <p class="help">Other phones in your family join with this code.</p>
        </div>
        <p class="help">We'll watch the briefing together first. This screen changes on its own when Operator Arco starts the game.</p>
        ${backend.kind === "demo" ? `<button class="btn" data-action="demo-start">Start the game (demo)</button>` : ""}
      </section>`;
    },

    briefing() {
      const steps = GAME.briefing;
      if (view.step >= steps.length) {
        // After the last scene: everything from the briefing, pinned up as evidence.
        return `<section class="screen briefing">
          ${evidenceBoard(steps)}
          <p class="lede">That's the whole briefing, agents. Every relay you restore gets the town closer to lights on.</p>
          <div class="brief-nav">
            <button class="btn" data-action="briefing-back">Back</button>
            <button class="btn primary" data-action="briefing-done">Back to the game</button>
          </div>
        </section>`;
      }
      const b = steps[view.step];
      const last = false;
      const pic = b.image ? `<img src="${esc(b.image)}" alt="">` : (window.SCENES && SCENES[b.scene]) || "";
      return `<section class="screen briefing">
        <h1>${b.voice === "badguys" ? "Incoming transmission" : "Your briefing"}</h1>
        ${pic ? `<figure class="scene enter ${steps[view.step - 1] && steps[view.step - 1].cut ? "roll" : ""}">${pic}</figure>` : ""}
        <div class="brief-progress" role="img" aria-label="Part ${view.step + 1} of ${steps.length}">${steps.map((_, i) => `<span class="${i < view.step ? "on" : i === view.step ? "here" : ""}"></span>`).join("")}</div>
        <div class="radio ${b.voice}">
          <p class="radio-from">From ${esc(b.from)}</p>
          <div class="radio-text" id="radio-text"></div>
          <button class="btn small on-dark sound-btn" data-action="brief-sound">${narrate ? "Sound off" : "Play with sound"}</button>
        </div>
        <div class="brief-nav ${view.step === 0 ? "solo" : ""}">
          ${view.step > 0 ? `<button class="btn" data-action="briefing-back">Back</button>` : ""}
          <button class="btn primary" data-action="${last ? "briefing-done" : "briefing-next"}">${last ? "Back to the game" : "Next"}</button>
        </div>
      </section>`;
    },

    board() {
      const ids = allIds();
      const nxt = nextPlace();
      const fam = S.progress.family && S.progress.family.stage === "restored";
      const digits = (S.digits || "").padEnd(4, " ").split("");
      return `${topbar(false)}<section class="screen">
        <h1>Relay board</h1>
        <p class="help">${restoredIds().length} of ${ids.length} relays restored. Every two relays give you one digit of your family's code.</p>
        <ol class="lamps">
          ${ids.map((id, i) => {
            const r = relayById(id);
            const p = S.progress[id];
            const on = p && p.stage === "restored";
            const locked = id === "family" && !familyUnlocked();
            const current = id === nxt;
            return `<li class="lamp-item"><button class="lamp ${on ? "on" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""}" data-action="open-relay" data-id="${id}" ${locked ? "disabled" : ""} aria-label="${esc(label(id))}${on ? ", restored" : locked ? ", unlocks after 3 relays" : ""}">${ATOM}</button><span class="lamp-label">${esc(shortLabel(id))}</span></li>`;
          }).join("")}
        </ol>
        <div class="code-slots" aria-label="Your code so far">${digits.map((d) => `<span class="slot ${d.trim() ? "filled" : ""}">${esc(d.trim() || "")}</span>`).join("")}</div>
        <div class="stack">
          ${nxt ? `<button class="btn primary" data-action="open-relay" data-id="${nxt}">${restoredIds().length || Object.keys(S.progress).length ? "Next" : "Start your route"}: ${esc(label(nxt))}</button>` : ""}
          ${familyUnlocked() && !fam ? `<button class="btn" data-action="open-relay" data-id="family">Solve the Family Relay in the car</button>` : ""}
          ${!familyUnlocked() ? `<p class="help">The Family Relay unlocks after ${GAME.family.unlockAfter} relays.</p>` : ""}
          ${allDone() ? `<button class="btn primary" data-action="finale">Head to the substation</button>` : ""}
        </div>
        ${S.queue.length ? `<p class="note">${S.queue.length} restored relay${S.queue.length > 1 ? "s" : ""} will sync when you have signal.</p>` : ""}
      </section>`;
    },

    relay() {
      const id = view.id;
      const r = relayById(id);
      const p = prog(id);
      const pos = id === "family" ? null : S.team.route.indexOf(id) + 1;
      if (p.stage === "restored") return restoredView(r, p);
      if (id !== "family" && p.stage === "find") {
        return `${topbar(true)}<section class="screen">
          <h1>${esc(label(id))}</h1>
          ${pos ? `<p class="help">Stop ${pos} of ${S.team.route.length} on your route. Its name shows up once you get there.</p>` : ""}
          <div class="badguys-note">
            <p class="radio-from">Intercepted from the Bad Guys</p>
            <p>${esc(r.find)}</p>
          </div>
          <div class="stack">
            <button class="btn primary" data-action="arrived">We're here</button>
            ${p.map
              ? `<div class="map-reveal"><p><strong>${esc(r.place)}</strong></p><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.mapQuery)}">Open in Maps</a></div>`
              : `<button class="btn" data-action="show-map">Show on map (${GAME.scoring.map} points)</button>`}
            <button class="link" data-action="later">Come back to this one later</button>
          </div>
        </section>`;
      }
      return `${topbar(true)}<section class="screen">
        <h1>${esc(r.name)}</h1>
        <div class="radio operator">
          <p class="radio-from">From Operator Arco</p>
          <div class="radio-text" id="radio-text">${p.typed ? para(r.transmission) : ""}</div>
          <button class="btn small on-dark" data-action="listen" data-id="${id}">Play out loud</button>
        </div>
        ${r.history ? `<article class="history"><h2>True history</h2><p>${esc(r.history)}</p><p class="source">Source: <a href="${esc(r.source.url)}" target="_blank" rel="noopener">${esc(r.source.label)}</a></p></article>` : ""}
        ${mainPuzzle(id, r, p)}
        ${juniorPuzzle(id, r, p)}
      </section>`;
    },

    finale() {
      if (S.switchThrown) return victoryView();
      if (!S.quizStarted) {
        return `${topbar(false)}<section class="screen">
          <h1>All relays restored</h1>
          <p class="lede">${esc(GAME.finale.goTo)}</p>
          <p class="code-big lock" aria-label="Padlock code">${esc((S.digits || "????").split("").join(" "))}</p>
          <p>${esc(GAME.finale.lockNote)}</p>
          <button class="btn primary" data-action="quiz-start">We're at the substation</button>
        </section>`;
      }
      const q = GAME.finale.quiz;
      const i = S.quiz.length;
      if (i < q.length && !S.quizDone) {
        const item = q[i];
        return `${topbar(false)}<section class="screen">
          <h1>True or invented?</h1>
          <p class="help">Question ${i + 1} of ${q.length}. While you wait for the other families.</p>
          <p class="statement">${esc(item.text)}</p>
          <div class="pair">
            <button class="btn primary" data-action="quiz" data-v="true">True</button>
            <button class="btn" data-action="quiz" data-v="false">Invented</button>
          </div>
        </section>`;
      }
      const right = S.quiz.filter((a, n) => a === q[n].truth).length;
      return `${topbar(false)}<section class="screen">
        <h1>Stand by for the master switch</h1>
        <p>You got ${right} of ${q.length} right.</p>
        <ul class="quiz-review">${q.map((item, n) => `<li><strong>${item.truth ? "True" : "Invented"}.</strong> ${esc(item.text)} ${esc(item.why)}</li>`).join("")}</ul>
        <p class="lede">${esc(GAME.finale.switchText)}</p>
        <div class="bulbs" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        ${backend.kind === "demo" ? `<button class="btn primary" data-action="throw-switch">Throw the switch (demo)</button>` : `<p class="help">This screen changes when Operator Arco throws the switch.</p>`}
      </section>`;
    },

    settings() {
      return `${topbar(true)}<section class="screen">
        <h1>Settings</h1>
        <p>Team code</p>
        <p class="code-big">${esc(S.code.split("").join(" "))}</p>
        ${S.started ? `<button class="btn" data-action="watch-briefing">Watch the briefing again</button>` : ""}
        <label class="choice"><input type="checkbox" data-setting="navigator" ${S.settings.navigator ? "checked" : ""}><span>This phone is the navigator's phone. The driver never uses it.</span></label>
        ${S.team.tracking ? `<label class="choice"><input type="checkbox" data-setting="tracking" ${S.settings.tracking ? "checked" : ""}><span>Share this phone's location with the game master.</span></label>` : ""}
        ${CONFIG.demoTools ? `<h2>Demo tools</h2>
          <label class="choice"><input type="checkbox" data-setting="showAnswers" ${S.settings.showAnswers ? "checked" : ""}><span>Show answers</span></label>
          <div class="stack">
            <button class="btn" data-action="test-transmission">Send a test transmission</button>
            <button class="btn" data-action="reset">Reset this phone</button>
          </div>` : ""}
        <button class="link" data-action="leave">Leave this team on this phone</button>
      </section>`;
    },
  };

  function mainPuzzle(id, r, p) {
    const clue = id === "family" ? S.team.familyClue : r.clue;
    if (id === "family" && !clue) return `<div class="clue"><p>${esc(GAME.family.waiting)}</p></div>`;
    const shown = id === "family" ? null : demoAnswer(id, "main");
    if (p.main) return `<div class="clue solved"><p class="ok">Code accepted.</p><p class="muted">${esc(clue)}</p></div>`;
    const hints = r.hints || [];
    return `<div class="clue">
      <h2>Your clue</h2>
      <p>${esc(clue)}</p>
      ${r.morse ? `<button class="btn" data-action="morse" data-id="${id}">Play the signal</button>` : ""}
      <form id="answer" data-target="main" class="answer">
        <label class="sr" for="ans">Answer</label>
        <input id="ans" name="answer" ${r.answerKind === "number" ? 'inputmode="numeric"' : 'autocapitalize="characters"'} autocomplete="off" placeholder="Answer">
        <button class="btn primary" type="submit">Check</button>
      </form>
      <p class="feedback" role="alert"></p>
      ${p.hints > 0 ? `<ul class="hints">${hints.slice(0, p.hints).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      ${p.hints < hints.length ? `<button class="link" data-action="hint" data-id="${id}">Get a hint (${GAME.scoring.hint} points)</button>` : ""}
      ${shown ? `<p class="demo-answer">Demo answer: ${esc(shown)}</p>` : ""}
    </div>`;
  }

  function juniorPuzzle(id, r, p) {
    const j = r.junior;
    if (!j) return "";
    const hasJuniors = (S.team.agents || []).some(isJuniorAgent);
    const title = hasJuniors ? "Junior Agent" : "Youngest agent";
    if (p.junior) return `<div class="junior solved"><h2>${title}</h2><p class="ok">Done. Nice work.</p></div>`;
    let controls = "";
    if (j.type === "choice") {
      controls = `<div class="options">${j.options.map((o) => `<button class="option" data-action="junior" data-v="${esc(o.value)}">${o.icon ? ICONS[o.icon] : ""}<span>${esc(o.label)}</span></button>`).join("")}</div>`;
    } else if (j.type === "count") {
      controls = `<form id="junior-form" class="answer"><label class="sr" for="jans">Number</label><input id="jans" name="answer" inputmode="numeric" autocomplete="off" placeholder="Number"><button class="btn primary" type="submit">Check</button></form>`;
    } else if (j.type === "open" && j.options) {
      controls = `<div class="options">${j.options.map((o) => `<button class="option" data-action="junior-any" data-v="${esc(o.value)}"><span>${esc(o.label)}</span></button>`).join("")}</div>`;
    } else {
      controls = `<button class="btn primary" data-action="junior-any" data-v="done">Done</button>`;
    }
    const shown = demoAnswer(id, "junior");
    return `<div class="junior">
      <h2>${title}</h2>
      <p class="junior-prompt">${esc(j.prompt)}</p>
      <button class="btn small" data-action="listen-junior" data-id="${id}">Hear it</button>
      ${controls}
      <p class="feedback junior-feedback" role="alert"></p>
      ${shown ? `<p class="demo-answer">Demo answer: ${esc(shown)}</p>` : ""}
    </div>`;
  }

  function restoredView(r, p) {
    const digitsNow = S.digits || "";
    const newDigit = view.justRestored && view.newDigit;
    return `${topbar(true)}<section class="screen restored-screen">
      <div class="lamp big on" aria-hidden="true">${ATOM}</div>
      <h1>${esc(r.name)} restored</h1>
      ${newDigit ? `<p class="lede">New digit for your code: <span class="digit">${esc(digitsNow.slice(-1))}</span></p>` : `<p class="lede">${restoredIds().length} of ${allIds().length} relays restored.</p>`}
      ${r.history ? `<article class="history"><h2>True history</h2><p>${esc(r.history)}</p></article>` : ""}
      <div class="stack">
        ${allDone()
          ? `<button class="btn primary" data-action="finale">Head to the substation</button>`
          : nextPlace()
            ? `<button class="btn primary" data-action="open-relay" data-id="${nextPlace()}">Next: ${esc(label(nextPlace()))}</button>`
            : `<button class="btn primary" data-action="open-relay" data-id="family">Solve the Family Relay</button>`}
        <button class="btn" data-action="board">Relay board</button>
      </div>
    </section>`;
  }

  function victoryView() {
    const v = GAME.finale.victory;
    return `<section class="screen victory">
      <div class="bulbs lit" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <h1>Arco is lit</h1>
      <div class="radio gobbles">
        <p class="radio-from">From ${esc(v.from)}</p>
        <div class="radio-text" id="radio-text"></div>
        <button class="btn small on-dark" data-action="listen-victory">Play out loud</button>
      </div>
      <p class="lede">${esc(S.team.name)} finished with ${score()} points.</p>
      <details class="cards"><summary>Every true-history card you collected</summary>
        ${GAME.relays.map((r) => `<article class="history"><h2>${esc(r.name)}</h2><p>${esc(r.history)}</p></article>`).join("")}
      </details>
    </section>`;
  }

  // Next briefing scene. Leaving a scene marked `cut` plays the Bad Guys' hijack first.
  let hijacking = false;
  function nextBriefing() {
    if (hijacking) return;
    const b = GAME.briefing[view.step];
    const next = () => go("briefing", { step: view.step + 1 });
    if (!b || !b.cut) return next();
    hijacking = true;
    clearTimeout(briefTimer);
    clearTimeout(typingTimer);
    hijack(app.querySelector(".scene"), document.getElementById("radio-text"), app.querySelector(".briefing .radio"), () => {
      hijacking = false;
      if (view.name === "briefing") next();
    });
  }

  // Reads the current briefing scene aloud, then moves on to the next one by itself.
  function narrateScene() {
    clearTimeout(briefTimer);
    const step = view.step;
    const b = GAME.briefing[step];
    const still = () => narrate && view.name === "briefing" && view.step === step;
    const ok = GAMEAUDIO.play(b.audio, b.text, b.voice, () => {
      if (!still()) return;
      briefTimer = setTimeout(() => { if (still()) nextBriefing(); }, b.cut ? 0 : 1200);
    });
    if (ok === false) {
      narrate = false;
      const btn = app.querySelector(".sound-btn");
      if (btn) btn.textContent = "Play with sound";
      toast("This phone can't read aloud. Tap Next to keep going.");
    }
  }

  // ---------- after-render hooks ----------
  const AFTER = {
    signup() {
      const box = document.getElementById("agents");
      addAgentRow(box); addAgentRow(box);
    },
    briefing() {
      const b = GAME.briefing[view.step];
      if (!b) return; // the evidence board
      const prev = GAME.briefing[view.step - 1];
      const newSpeaker = !prev || prev.voice !== b.voice;
      typeInto(document.getElementById("radio-text"), b.text);
      clearTimeout(briefTimer);
      if (narrate) {
        const step = view.step;
        // Static when the speaker changes, then the narrator starts once it clears.
        if (newSpeaker) GAMEAUDIO.staticBurst(0.9);
        briefTimer = setTimeout(() => { if (view.name === "briefing" && view.step === step) narrateScene(); }, newSpeaker ? 900 : 300);
      } else if (newSpeaker) {
        GAMEAUDIO.staticBurst(0.9);
      }
    },
    relay() {
      const p = prog(view.id);
      const el = document.getElementById("radio-text");
      if (el && !p.typed && p.stage !== "find" && p.stage !== "restored") {
        p.typed = true; // type it out once; later renders show the full text
        save();
        GAMEAUDIO.staticBurst(0.7);
        typeInto(el, relayById(view.id).transmission);
      }
      if (view.justRestored) { GAMEAUDIO.chime(); view.justRestored = false; }
      keepAwake();
    },
    finale() {
      if (S.switchThrown) {
        const el = document.getElementById("radio-text");
        typeInto(el, GAME.finale.victory.text);
      }
    },
    board() { keepAwake(); },
  };

  function addAgentRow(box) {
    const n = box.children.length;
    const row = document.createElement("div");
    row.className = "agent-row";
    row.innerHTML = `<label class="field"><span>First name</span><input name="agentName" maxlength="20" autocomplete="off"></label>
      <label class="field age"><span>Age</span><input name="agentAge" inputmode="numeric" maxlength="2"></label>`;
    box.appendChild(row);
    if (n > 0) row.querySelector("input").focus();
  }

  // ---------- actions ----------
  async function checkMain(target, value) {
    const fb = app.querySelector(".clue .feedback, .feedback");
    if (!normalizeAnswer(value)) { fb.textContent = "Type an answer first."; return; }
    const id = view.id;
    const p = prog(id);
    const expected = id === "family" ? S.team.familyHash : ANSWER_HASHES.relays[id].main;
    if (answerHash(value) === expected) {
      p.main = true; p.mainValue = value; save();
      GAMEAUDIO.chime();
      return maybeRestore(id);
    }
    GAMEAUDIO.buzz();
    fb.textContent = "The relay is still jammed. Check your work and try again.";
  }

  function juniorAnswer(value, any) {
    const id = view.id;
    const p = prog(id);
    const fb = app.querySelector(".junior-feedback");
    p.juniorTries += 1;
    if (!any) {
      const h = (ANSWER_HASHES.relays[id] || {}).junior;
      if (h && answerHash(value) !== h) {
        save(); GAMEAUDIO.buzz();
        fb.textContent = "Not quite. Look again and try one more time.";
        return;
      }
      p.juniorFirstTry = p.juniorTries === 1;
    }
    p.junior = true; p.juniorValue = value; save();
    GAMEAUDIO.chime();
    maybeRestore(id);
  }

  async function maybeRestore(id) {
    const p = prog(id);
    const r = relayById(id);
    if (!p.main || (r.junior && !p.junior)) return render();
    p.stage = "restored";
    p.restoredAt = Date.now();
    save();
    const detail = { main: p.mainValue, junior: p.juniorValue, hints: p.hints, map: p.map, juniorFirstTry: !!p.juniorFirstTry };
    const before = (S.digits || "").length;
    try {
      const res = await backend.recordSolve(S.code, id, detail);
      if (res && typeof res.digits === "string") S.digits = res.digits;
    } catch (e) {
      if (e.offline) {
        S.queue.push({ id, detail });
        S.digits = localDigitsGuess();
      } else {
        toast(e.message || "Couldn't reach Station ARCO. Your progress is saved on this phone.");
      }
    }
    save();
    go("relay", { id, justRestored: true, newDigit: (S.digits || "").length > before });
  }

  // While offline we can't know the digits, so we keep what we have.
  function localDigitsGuess() { return S.digits || ""; }

  async function flushQueue() {
    if (!S.queue.length || !S.code) return;
    const pending = S.queue.slice();
    for (const item of pending) {
      try {
        const res = await backend.recordSolve(S.code, item.id, item.detail);
        S.queue.shift();
        if (res && typeof res.digits === "string") S.digits = res.digits;
        save();
      } catch (e) { break; }
    }
    if (view.name === "board") render();
  }

  async function submitSignup(form) {
    const err = document.getElementById("signup-error");
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const names = data.getAll("agentName").map((x) => String(x).trim());
    const ages = data.getAll("agentAge").map((x) => parseInt(x, 10));
    const agents = names.map((n, i) => ({ name: n, age: ages[i] || null })).filter((a) => a.name);
    if (!name) { err.textContent = "Give your team a name."; return; }
    if (!agents.length) { err.textContent = "Add at least one agent."; return; }
    const form2 = {
      name,
      level: data.get("level") || "agent",
      agents,
      facts: {
        weddingYear: String(data.get("weddingYear") || "").trim(),
        pet: String(data.get("pet") || "").trim(),
        favorite: String(data.get("favorite") || "").trim(),
        place: String(data.get("place") || "").trim(),
        secret: String(data.get("secret") || "").trim(),
      },
      tracking: !!data.get("tracking"),
    };
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Creating your team";
    try {
      const team = await backend.createTeam(form2);
      S = fresh();
      S.code = team.code;
      S.team = team;
      S.started = team.started !== false; // an older server without the start switch counts as started
      S.settings.tracking = !!team.tracking;
      save();
      startLive();
      home();
    } catch (e) {
      err.textContent = e.offline ? "No signal. Try again when you have a connection." : e.message;
      btn.disabled = false; btn.textContent = "Create our team";
    }
  }

  async function submitJoin(form) {
    const err = document.getElementById("join-error");
    const code = String(new FormData(form).get("code") || "").toUpperCase().trim();
    if (code.length < 6) { err.textContent = "Team codes are 6 letters and numbers."; return; }
    try {
      const team = await backend.joinTeam(code);
      S = fresh();
      S.code = team.code;
      S.team = team;
      S.started = team.started !== false;
      S.digits = team.digits || "";
      S.settings.navigator = false;
      mergeSolves(team.solves);
      save();
      startLive();
      home();
    } catch (e) {
      err.textContent = e.offline ? "No signal. Try again when you have a connection." : e.message;
    }
  }

  // ---------- live features ----------
  let wakeLock = null;
  async function keepAwake() {
    if (!S.settings.navigator || !("wakeLock" in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } catch (e) { /* not allowed, fine */ }
  }

  let geoWatch = null;
  let lastSent = 0;
  function updateTracking() {
    const want = S.team && S.team.tracking && S.settings.tracking && S.settings.navigator && "geolocation" in navigator;
    if (want && geoWatch == null) {
      geoWatch = navigator.geolocation.watchPosition((pos) => {
        if (Date.now() - lastSent < CONFIG.locationEveryMs) return;
        lastSent = Date.now();
        backend.postLocation(S.code, pos).catch(() => {});
      }, () => {}, { enableHighAccuracy: true, maximumAge: 15000 });
    } else if (!want && geoWatch != null) {
      navigator.geolocation.clearWatch(geoWatch);
      geoWatch = null;
    }
  }

  let subscribed = false;
  function startLive() {
    if (!S.code) return;
    if (!subscribed) {
      backend.subscribe(S.code, showTransmission);
      subscribed = true;
    }
    updateTracking();
    flushQueue().then(refreshTeam);
  }

  // Picks up a family clue or digits that arrived while this phone had no signal.
  // Brings over relays the family restored on another phone. Returns true if anything new arrived.
  function mergeSolves(solves) {
    let added = false;
    Object.keys(solves || {}).forEach((id) => {
      if (S.progress[id] && S.progress[id].stage === "restored") return;
      const s = solves[id];
      S.progress[id] = { stage: "restored", hints: s.hints || 0, map: !!s.map, main: true, junior: true, juniorTries: 1, juniorFirstTry: !!s.juniorFirstTry, typed: true };
      added = true;
    });
    return added;
  }

  async function refreshTeam() {
    if (backend.kind !== "supabase" || !S.code) return;
    try {
      const t = await backend.joinTeam(S.code);
      S.team.familyClue = t.familyClue;
      S.team.familyHash = t.familyHash;
      if ((t.digits || "").length > (S.digits || "").length) S.digits = t.digits;
      const newSolves = mergeSolves(t.solves);
      const started = t.started !== false;
      const changed = started !== !!S.started;
      S.started = started;
      save();
      // Started while this phone was asleep, or put back to waiting after a dry run.
      if (changed && (view.name === "waiting" || !started)) return home();
      if (newSolves && allDone() && view.name !== "finale") return go("finale");
      if (view.name === "board" || (newSolves && view.name === "relay" && S.progress[view.id] && S.progress[view.id].stage === "restored")) render();
    } catch (e) { /* offline; try again later */ }
  }

  // The front page's "What happened in 2024?" pop-up.
  function showBackstory() {
    const s = GAME.backstory;
    overlay.innerHTML = `<div class="overlay-inner backstory" role="dialog" aria-modal="true" aria-labelledby="bs-title">
      <div class="backstory-head">
        <img src="img/dossier.webp" alt="">
        <h2 id="bs-title">${esc(s.title)}</h2>
      </div>
      ${s.sections.map((x, i) => `<section style="--i:${i}"><h3>${esc(x.heading)}</h3><p>${esc(x.text)}</p></section>`).join("")}
      <div class="backstory-gobbles"><img src="img/gobbles.webp" alt="Ambassador Gobbles"><p><strong>Ambassador Gobbles</strong>Rescued 2024. Chairing the 2026 Peace Summit.</p></div>
      <button class="btn primary" data-action="close-overlay">Close the file</button>
    </div>`;
    overlay.hidden = false;
    overlay.scrollTop = 0;
    overlay.querySelector("h2").setAttribute("tabindex", "-1");
    overlay.querySelector("h2").focus();
  }

  function showTransmission(msg) {
    if (msg.kind === "start") {
      S.started = true; save();
      if (view.name === "waiting") home();
    }
    if (msg.kind === "switch") {
      S.switchThrown = true; save();
      if (allDone()) go("finale");
      return;
    }
    if (msg.kind === "family_clue" && msg.payload) {
      S.team.familyClue = msg.payload.text;
      S.team.familyHash = msg.payload.hash;
      save();
    }
    GAMEAUDIO.staticBurst(1.1);
    overlay.innerHTML = `<div class="overlay-inner" role="dialog" aria-modal="true" aria-labelledby="tx-title">
      <h2 id="tx-title">Incoming transmission</h2>
      <div class="radio ${esc(msg.voice || "operator")}">
        <p class="radio-from">From ${esc(msg.sender || "Operator Arco")}</p>
        <div class="radio-text" id="tx-text"></div>
      </div>
      <button class="btn primary" data-action="close-overlay">Got it</button>
    </div>`;
    overlay.hidden = false;
    typeInto(document.getElementById("tx-text"), msg.body || "");
    overlay.querySelector("button").focus();
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-action]");
    if (!t) return;
    GAMEAUDIO.ensure();
    const a = t.dataset.action;
    const id = t.dataset.id;
    switch (a) {
      case "start": return go("start");
      case "signup": return go("signup");
      case "join": return go("join");
      case "home": return home();
      case "board": return S.started ? go("board") : home();
      case "settings": return go("settings");
      case "finale": return go("finale");
      case "add-agent": return addAgentRow(document.getElementById("agents"));
      case "brief-sound": {
        narrate = !narrate;
        t.textContent = narrate ? "Sound off" : "Play with sound";
        if (narrate) return narrateScene();
        clearTimeout(briefTimer);
        return GAMEAUDIO.stop();
      }
      case "briefing-next": return nextBriefing();
      case "briefing-back": return go("briefing", { step: Math.max(0, view.step - 1) });
      case "briefing-done": narrate = false; S.briefingDone = true; save(); return home();
      case "watch-briefing": return go("briefing", { step: 0 });
      case "backstory": return showBackstory();
      case "demo-start":
        backend.setStarted(true);
        return backend.testBroadcast({ kind: "start", sender: "Operator Arco", voice: "operator", body: "Station ARCO to all agents. The mission is live. Start your route. Over." });
      case "open-relay": return go("relay", { id });
      case "arrived": prog(view.id).stage = "here"; save(); return render();
      case "show-map": prog(view.id).map = true; save(); return render();
      case "later": {
        const route = S.team.route;
        route.push(route.splice(route.indexOf(view.id), 1)[0]);
        save();
        toast("Moved to the end of your route.");
        return go("board");
      }
      case "listen": { const r = relayById(id); return GAMEAUDIO.play(r.audio, r.transmission, "operator"); }
      case "listen-junior": return GAMEAUDIO.speak(relayById(id).junior.prompt, "junior");
      case "listen-victory": { const v = GAME.finale.victory; return GAMEAUDIO.play(v.audio, v.text, "gobbles"); }
      case "morse": return GAMEAUDIO.morse(relayById(id).morse);
      case "hint": prog(id).hints += 1; save(); return render();
      case "junior": return juniorAnswer(t.dataset.v, false);
      case "junior-any": return juniorAnswer(t.dataset.v, true);
      case "quiz-start": S.quizStarted = true; save(); return render();
      case "quiz": {
        const item = GAME.finale.quiz[S.quiz.length];
        const v = t.dataset.v === "true";
        S.quiz.push(v);
        if (S.quiz.length === GAME.finale.quiz.length) S.quizDone = true;
        save();
        toast(`${v === item.truth ? "Right." : "Not quite."} ${item.why}`, v === item.truth ? "good" : "");
        return render();
      }
      case "throw-switch": S.switchThrown = true; save(); GAMEAUDIO.chime(); return go("finale");
      case "test-transmission":
        return backend.testBroadcast
          ? backend.testBroadcast({ sender: "The Bad Guys", voice: "badguys", body: "Your ambassador wouldn't stop talking about gratitude, so we took him to the substation. Bring every code you've got. All of them. Or the gravy goes cold." })
          : toast("Test transmissions come from the game master console.");
      case "close-overlay": overlay.hidden = true; overlay.innerHTML = ""; GAMEAUDIO.stop(); return;
      case "reset":
        if (confirmInline(t, "Tap again to erase this phone's game")) { localStorage.removeItem(STORE); localStorage.removeItem("roothog.demo.teams"); localStorage.removeItem("roothog.demo.started"); S = fresh(); go("start"); }
        return;
      case "leave":
        if (confirmInline(t, "Tap again to leave the team on this phone")) { localStorage.removeItem(STORE); S = fresh(); go("start"); }
        return;
    }
  });

  // Two-tap confirm instead of a browser dialog.
  function confirmInline(btn, text) {
    if (btn.dataset.armed) return true;
    btn.dataset.armed = "1";
    btn.dataset.label = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = btn.dataset.label; } }, 4000);
    return false;
  }

  document.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id === "signup") return submitSignup(f);
    if (f.id === "join") return submitJoin(f);
    if (f.id === "answer") return checkMain(f.dataset.target, new FormData(f).get("answer"));
    if (f.id === "junior-form") return juniorAnswer(new FormData(f).get("answer"), false);
  });

  document.addEventListener("change", (e) => {
    const k = e.target.dataset && e.target.dataset.setting;
    if (!k) return;
    S.settings[k] = e.target.checked;
    save();
    updateTracking();
    if (k === "showAnswers") render();
  });

  window.addEventListener("online", () => flushQueue().then(refreshTeam));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    wakeLock = null;
    if (["board", "relay"].includes(view.name)) keepAwake();
    if (S.code) refreshTeam();
  });
  // Every 30 seconds, catch up: the start of the game, and relays restored on the family's other phones.
  setInterval(() => { if (S.code && !document.hidden && view.name !== "start") refreshTeam(); }, 30000);

  // ---------- boot ----------
  function boot() {
    if (backend.kind === "demo" && CONFIG.demoTools) {
      const s = document.createElement("script");
      s.src = "js/demo-answers.js";
      s.onload = () => { if (S.settings.showAnswers) render(); };
      document.body.appendChild(s);
    }
    // Offline caching only for the real game, so demo previews never show a stale copy.
    if (backend.kind === "supabase" && "serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    if (S.code) startLive();
    home();
  }
  boot();
})();
