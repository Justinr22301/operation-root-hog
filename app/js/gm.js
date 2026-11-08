// Station ARCO game master console. Signs in with Supabase Auth; every call is checked against gm_allowlist on the server.
// Add ?mock to the URL (with demoTools on) to try the screen with made-up families and no server.
(function () {
  const C = window.CONFIG || {};
  const root = document.getElementById("gm");
  const POLL_MS = 10000;

  const SENDERS = [
    { sender: "Operator Arco", voice: "operator" },
    { sender: "The Bad Guys", voice: "badguys" },
    { sender: "Ambassador Gobbles", voice: "gobbles" },
  ];
  const SAVED_LINES = [
    { sender: "The Bad Guys", body: "Your ambassador wouldn't stop talking about gratitude, so we took him to the substation. Bring every code you've got." },
    { sender: "Operator Arco", body: "All agents: head to the Arco Rec Center now. The switch goes at noon." },
    { sender: "Operator Arco", body: "Agents, check in. If you're stuck, use a hint. It only costs 25 points." },
  ];
  const FACT_LABELS = { weddingYear: "Wedding year", pet: "Pet", favorite: "Favorite", place: "Place", secret: "Secret" };

  const RELAYS = {};
  (window.GAME.relays || []).forEach((r) => (RELAYS[r.id] = r));
  RELAYS.family = window.GAME.family;
  const TOTAL = (window.GAME.relays || []).length + 1;

  let api = null;
  let data = null;
  let selected = null;
  let lastLoad = 0;
  let pollTimer = null;
  let map = null;
  let markers = {};
  let fitted = false;

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function clock(t) {
    return t ? new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  }
  function ago(t) {
    if (!t) return "";
    const s = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    return clock(t);
  }
  function isJunior(a) { return Number(a.age) > 0 && Number(a.age) < 8; }
  function team(code) { return data && data.teams.find((t) => t.code === code); }
  function $(sel) { return root.querySelector(sel); }
  function flash(el, msg, bad) {
    el.textContent = msg;
    el.className = bad ? "error" : "ok";
    if (!bad) setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 4000);
  }

  // ---------- server ----------
  function supabaseApi() {
    const client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
      auth: { persistSession: true, storageKey: "roothog.gm.auth" },
    });
    async function rpc(name, args) {
      const res = await client.rpc(name, args || {});
      if (res.error) throw new Error(res.error.message || "Something went wrong");
      return res.data;
    }
    return {
      async session() { const r = await client.auth.getSession(); return r.data.session; },
      async signIn(email, password) {
        const r = await client.auth.signInWithPassword({ email, password });
        if (r.error) throw new Error(r.error.message === "Invalid login credentials" ? "That email and password don't match." : r.error.message);
      },
      async signOut() { await client.auth.signOut(); },
      state: () => rpc("gm_state"),
      setClue: (code, clue, answer) => rpc("gm_set_family_clue", { p_code: code, p_clue: clue, p_answer: answer }),
      send: (body, sender, voice, code) => rpc("gm_send_broadcast", { p_body: body, p_sender: sender, p_voice: voice, p_team_code: code || null }),
      throwSwitch: () => rpc("gm_throw_master_switch"),
    };
  }

  function mockApi() {
    const min = (m) => new Date(Date.now() - m * 60000).toISOString();
    const solve = (m, hints, mapUsed, jr) => ({ at: min(m), hints: hints || 0, map: !!mapUsed, juniorFirstTry: !!jr });
    const st = {
      now: new Date().toISOString(),
      broadcasts: [{ id: 1, created_at: min(50), team_code: null, kind: "message", sender: "Operator Arco", voice: "operator", body: "Kickoff in five minutes." }],
      teams: [
        { code: "K7M2QX", name: "The Gravy Boats", level: "agent", lockCode: "4821", tracking: true, createdAt: min(70),
          agents: [{ name: "Justin", age: 38 }, { name: "Emmett", age: 9 }, { name: "Beckham", age: 5 }, { name: "Colby", age: 3 }],
          facts: { weddingYear: "2014", pet: "Scout", favorite: "Pie", place: "Yellowstone", secret: "" },
          route: ["peace", "sub", "hill", "courthouse", "press", "river", "island"],
          solves: { peace: solve(40, 0, 0, 1), sub: solve(28, 1, 0, 1), hill: solve(15) },
          familyClue: null, familyAnswer: null, location: { lat: 43.6373, lng: -113.3005, accuracy: 12, at: min(1) } },
        { code: "R4T9PA", name: "Team Drumstick", level: "senior", lockCode: "0937", tracking: true, createdAt: min(68),
          agents: [{ name: "Grandpa", age: 70 }, { name: "Grandma", age: 68 }],
          facts: { weddingYear: "1979", pet: "", favorite: "Stuffing", place: "Moore", secret: "" },
          route: ["island", "courthouse", "sub", "peace", "hill", "press", "river"],
          solves: { island: solve(45, 0, 0, 1), courthouse: solve(30, 2, 1), sub: solve(20), peace: solve(9), family: solve(5) },
          familyClue: "Two agents in your car joined forces in the year you need.", familyAnswer: "1979",
          location: { lat: 43.6351, lng: -113.2991, accuracy: 20, at: min(9) } },
        { code: "PZ3HWN", name: "Cranberry Crew", level: "agent", lockCode: "5560", tracking: false, createdAt: min(66),
          agents: [{ name: "Logan", age: 8 }, { name: "Harper", age: 0 }],
          facts: { weddingYear: "", pet: "Biscuit", favorite: "Rolls", place: "", secret: "Hates olives" },
          route: ["hill", "press", "river", "sub", "peace", "courthouse", "island"],
          solves: {}, familyClue: null, familyAnswer: null, location: null },
      ],
    };
    for (const t of st.teams) {
      t.restored = Object.keys(t.solves).length;
      t.score = Object.values(t.solves).reduce((s, v) => s + 100 - 25 * v.hints - (v.map ? 25 : 0) + (v.juniorFirstTry ? 25 : 0), 0);
    }
    let id = 2;
    const push = (b) => st.broadcasts.unshift(Object.assign({ id: id++, created_at: new Date().toISOString() }, b));
    return {
      mock: true,
      async session() { return { user: { email: "mock" } }; },
      async signIn() {},
      async signOut() {},
      async state() { st.now = new Date().toISOString(); return JSON.parse(JSON.stringify(st)); },
      async setClue(code, clue, answer) {
        const t = st.teams.find((x) => x.code === code);
        t.familyClue = clue; t.familyAnswer = answer.toUpperCase().replace(/[^A-Z0-9]/g, "");
        push({ team_code: code, kind: "family_clue", sender: "Operator Arco", voice: "operator", body: "Your Family Relay clue just came in." });
      },
      async send(body, sender, voice, code) { push({ team_code: code || null, kind: "message", sender, voice, body }); },
      async throwSwitch() { push({ team_code: null, kind: "switch", sender: "Operator Arco", voice: "operator", body: "Master switch thrown." }); },
    };
  }

  // ---------- sign in ----------
  function loginView(msg) {
    stopPolling();
    root.innerHTML = `
      <section class="screen narrow">
        <div class="plate plate-small"><div class="plate-top"><span>STATION ARCO</span></div><div class="plate-panel">Game master</div></div>
        <form class="form" id="login">
          <label class="field"><span>Email</span><input name="email" type="email" autocomplete="username" required></label>
          <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>
          <p class="error" id="login-err">${esc(msg || "")}</p>
          <button class="btn primary" type="submit">Sign in</button>
        </form>
        <p class="note">Families don't need this page. Their game is at <a href="./">the main link</a>.</p>
      </section>`;
    $("#login").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const btn = e.target.querySelector("button");
      btn.disabled = true; btn.textContent = "Signing in";
      try {
        await api.signIn(String(f.get("email")).trim(), String(f.get("password")));
        await start();
      } catch (err) {
        btn.disabled = false; btn.textContent = "Sign in";
        $("#login-err").textContent = err.message;
      }
    });
  }

  function noServerView() {
    root.innerHTML = `
      <section class="screen narrow">
        <h1>No server set up</h1>
        <p>The console needs the Supabase keys in <code>js/config.js</code>.</p>
        ${C.demoTools ? `<p><a class="btn" href="?mock">Try it with made-up families</a></p>` : ""}
      </section>`;
  }

  // ---------- console ----------
  function shell() {
    root.innerHTML = `
      <header class="gm-bar">
        <div class="gm-title"><strong>Station ARCO</strong> <span class="muted">Game master${api.mock ? " (made-up families)" : ""}</span></div>
        <div class="gm-bar-right">
          <span class="muted" id="updated"></span>
          <button class="btn small" data-act="refresh">Refresh</button>
          ${api.mock ? "" : `<button class="btn small" data-act="signout">Sign out</button>`}
        </div>
      </header>
      <p class="error gm-load-err" id="load-err"></p>
      <div class="gm-grid">
        <div class="gm-main">
          <section class="card">
            <h2>Families</h2>
            <div class="table-wrap"><table class="fam">
              <thead><tr><th>Family</th><th>Code</th><th>Relays</th><th>Score</th><th>Padlock</th><th>Family clue</th><th>Last seen</th></tr></thead>
              <tbody id="fam-rows"></tbody>
            </table></div>
            <p class="help" id="fam-empty" hidden>No families have signed up yet.</p>
          </section>
          <section class="card" id="detail" hidden></section>
          <section class="card">
            <h2>Map</h2>
            <div id="map" class="map"></div>
            <p class="help">Shows each family's last location, if they turned on location sharing. Faded dots are more than 5 minutes old.</p>
          </section>
        </div>
        <aside class="gm-side">
          <section class="card">
            <h2>Send a transmission</h2>
            <form class="form" id="send">
              <label class="field"><span>To</span><select name="to" id="send-to"><option value="">Every family</option></select></label>
              <label class="field"><span>From</span><select name="from">${SENDERS.map((s, i) => `<option value="${i}">${esc(s.sender)}</option>`).join("")}</select></label>
              <label class="field"><span>Message</span><textarea name="body" rows="4" maxlength="600" required></textarea></label>
              <label class="field"><span>Saved lines</span><select id="saved"><option value="">Pick one to fill the message</option>${SAVED_LINES.map((l, i) => `<option value="${i}">${esc(l.sender)}: ${esc(l.body.slice(0, 50))}…</option>`).join("")}</select></label>
              <p class="error" id="send-msg"></p>
              <button class="btn primary" type="submit">Send</button>
            </form>
          </section>
          <section class="card switch-card">
            <h2>Master switch</h2>
            <p class="help">Ends the game on every phone and shows the victory screen. It can't be undone.</p>
            <p id="switch-state"></p>
            <button class="btn danger" data-act="switch" id="switch-btn">Throw the master switch</button>
            <p class="error" id="switch-msg"></p>
          </section>
          <section class="card">
            <h2>Recent transmissions</h2>
            <ol class="log" id="log"></ol>
          </section>
        </aside>
      </div>`;

    $("#send").addEventListener("submit", onSend);
    $("#saved").addEventListener("change", (e) => {
      const line = SAVED_LINES[e.target.value];
      if (!line) return;
      const f = $("#send");
      f.body.value = line.body;
      f.from.value = String(SENDERS.findIndex((s) => s.sender === line.sender));
      e.target.value = "";
    });
    initMap();
  }

  function render() {
    if (!data) return;
    const teams = data.teams;

    // Family table
    $("#fam-empty").hidden = teams.length > 0;
    $("#fam-rows").innerHTML = teams.map((t) => {
      const digits = t.lockCode.slice(0, Math.floor(t.restored / 2));
      const loc = t.location;
      const stale = loc && Date.now() - new Date(loc.at).getTime() > 5 * 60000;
      return `<tr data-code="${esc(t.code)}" class="${t.code === selected ? "sel" : ""}" tabindex="0">
        <td class="fam-name">${esc(t.name)}</td>
        <td class="mono">${esc(t.code)}</td>
        <td><span class="bar"><span style="width:${(100 * t.restored) / TOTAL}%"></span></span> ${t.restored}/${TOTAL}</td>
        <td class="mono">${t.score}</td>
        <td class="mono">${esc(t.lockCode)} <span class="muted">(${digits.length} shown)</span></td>
        <td>${t.familyClue ? "Sent" : `<span class="warn">Not sent</span>`}</td>
        <td class="${stale ? "muted" : ""}">${loc ? esc(ago(loc.at)) : t.tracking ? "No fix yet" : "<span class=\"muted\">Off</span>"}</td>
      </tr>`;
    }).join("");

    // "To" choices, keeping the current pick
    const to = $("#send-to");
    const pick = to.value;
    to.innerHTML = `<option value="">Every family</option>` + teams.map((t) => `<option value="${esc(t.code)}">${esc(t.name)} (${esc(t.code)})</option>`).join("");
    to.value = teams.some((t) => t.code === pick) ? pick : "";

    // Switch state
    const sw = data.broadcasts.find((b) => b.kind === "switch");
    $("#switch-state").textContent = sw ? `Thrown at ${clock(sw.created_at)}.` : "";
    const btn = $("#switch-btn");
    if (!btn.classList.contains("armed")) btn.textContent = sw ? "Throw it again" : "Throw the master switch";

    // Log
    $("#log").innerHTML = data.broadcasts.map((b) => {
      const who = b.team_code ? (team(b.team_code) || { name: b.team_code }).name : "Everyone";
      const what = b.kind === "switch" ? "Master switch thrown" : b.kind === "family_clue" ? "Family clue sent" : esc(b.body);
      return `<li class="${esc(b.voice)}"><div class="log-meta">${esc(clock(b.created_at))} · ${esc(b.sender)} → ${esc(who)}</div><div>${what}</div></li>`;
    }).join("") || `<li class="muted">Nothing sent yet.</li>`;

    renderDetailInfo();
    renderMap();
    updated();
  }

  function updated() {
    const el = $("#updated");
    if (el && lastLoad) el.textContent = "Updated " + ago(lastLoad);
  }

  // ---------- family detail ----------
  function openDetail(code) {
    selected = selected === code ? null : code;
    root.querySelectorAll("#fam-rows tr").forEach((r) => r.classList.toggle("sel", r.dataset.code === selected));
    const box = $("#detail");
    const t = team(selected);
    if (!t) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = `
      <div class="detail-head">
        <h2>${esc(t.name)} <span class="mono muted">${esc(t.code)}</span></h2>
        <button class="link" data-act="close">Close</button>
      </div>
      <div id="detail-info"></div>
      <form class="form clue-form" id="clue">
        <h3>Family Relay clue</h3>
        <p class="help">Write a clue only this family can solve, using what they told you below. It reaches their phones right away and unlocks after ${window.GAME.family.unlockAfter} relays.</p>
        <label class="field"><span>Clue</span><textarea name="clue" rows="3" maxlength="600" required>${esc(t.familyClue || "")}</textarea></label>
        <label class="field"><span>Answer</span><input name="answer" class="mono" maxlength="40" required value="${esc(t.familyAnswer || "")}"></label>
        <p class="error" id="clue-msg"></p>
        <button class="btn primary" type="submit">${t.familyClue ? "Replace their clue" : "Send clue to their phones"}</button>
      </form>`;
    $("#clue").addEventListener("submit", onClue);
    renderDetailInfo();
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderDetailInfo() {
    const el = $("#detail-info");
    const t = team(selected);
    if (!el || !t) return;
    const facts = Object.entries(t.facts || {}).filter(([, v]) => v);
    const stops = t.route.concat(["family"]);
    const juniors = t.agents.filter(isJunior).length;
    el.innerHTML = `
      <div class="detail-cols">
        <div>
          <h3>Agents</h3>
          <ul class="plain">${t.agents.map((a) => `<li>${esc(a.name)}${a.age ? `, ${esc(a.age)}` : ""}${isJunior(a) ? " <span class=\"muted\">junior</span>" : ""}</li>`).join("")}</ul>
          <p class="help">${t.agents.length} agents, ${juniors} junior. ${t.level === "senior" ? "Senior level." : ""}</p>
          <h3>What they told us</h3>
          ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<dt>${esc(FACT_LABELS[k] || k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : `<p class="muted">Nothing.</p>`}
        </div>
        <div>
          <h3>Route</h3>
          <ol class="route">${stops.map((id) => {
            const s = t.solves[id];
            const r = RELAYS[id] || { name: id };
            const extra = s ? [s.hints ? `${s.hints} hint${s.hints > 1 ? "s" : ""}` : "", s.map ? "map" : ""].filter(Boolean).join(", ") : "";
            return `<li class="${s ? "done" : ""}"><span>${esc(r.name)}</span><span class="muted">${s ? esc(clock(s.at)) + (extra ? " · " + esc(extra) : "") : ""}</span></li>`;
          }).join("")}</ol>
          <p>Padlock code <strong class="mono">${esc(t.lockCode)}</strong></p>
        </div>
      </div>`;
  }

  // ---------- map ----------
  function initMap() {
    if (!window.L) { $("#map").innerHTML = `<p class="help">The map couldn't load. Check the connection.</p>`; return; }
    map = L.map($("#map"), { scrollWheelZoom: false }).setView([43.68, -113.33], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    markers = {};
    fitted = false;
  }

  function renderMap() {
    if (!map) return;
    const seen = new Set();
    for (const t of data.teams) {
      if (!t.location) continue;
      seen.add(t.code);
      const ll = [t.location.lat, t.location.lng];
      const stale = Date.now() - new Date(t.location.at).getTime() > 5 * 60000;
      const style = { radius: 9, weight: 3, color: "#1c4c9e", fillColor: stale ? "#c8c3b9" : "#f2c318", fillOpacity: 1, opacity: stale ? 0.5 : 1 };
      const label = `${t.name} · ${ago(t.location.at)}`;
      if (markers[t.code]) {
        markers[t.code].setLatLng(ll).setStyle(style).setTooltipContent(esc(label));
      } else {
        markers[t.code] = L.circleMarker(ll, style)
          .bindTooltip(esc(label), { permanent: true, direction: "right", className: "map-label" })
          .on("click", () => openDetail(t.code))
          .addTo(map);
      }
    }
    for (const code of Object.keys(markers)) {
      if (!seen.has(code)) { markers[code].remove(); delete markers[code]; }
    }
    const pts = Object.values(markers).map((m) => m.getLatLng());
    if (!fitted && pts.length) {
      map.fitBounds(L.latLngBounds(pts).pad(0.4), { maxZoom: 15 });
      fitted = true;
    }
  }

  // ---------- actions ----------
  async function load() {
    try {
      data = await api.state();
      lastLoad = Date.now();
      $("#load-err").textContent = "";
      render();
    } catch (err) {
      if (/not a game master/i.test(err.message)) {
        await api.signOut();
        return loginView("This account isn't on the game master list. Add its email to gm_allowlist in Supabase.");
      }
      if (/JWT|session/i.test(err.message)) return loginView("Please sign in again.");
      $("#load-err").textContent = "Couldn't refresh: " + err.message + ". Trying again shortly.";
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => { if (!document.hidden) load(); else updated(); }, POLL_MS);
  }
  function stopPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

  async function onSend(e) {
    e.preventDefault();
    const f = e.target;
    const msg = $("#send-msg");
    const s = SENDERS[Number(f.from.value)] || SENDERS[0];
    const to = f.to.value;
    const btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api.send(f.body.value.trim(), s.sender, s.voice, to);
      f.body.value = "";
      flash(msg, `Sent to ${to ? team(to).name : "every family"}.`);
      await load();
    } catch (err) {
      flash(msg, err.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  async function onClue(e) {
    e.preventDefault();
    const f = e.target;
    const msg = $("#clue-msg");
    const t = team(selected);
    const btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api.setClue(t.code, f.clue.value.trim(), f.answer.value.trim());
      flash(msg, "Sent. Their phones have it now.");
      btn.textContent = "Replace their clue";
      await load();
    } catch (err) {
      flash(msg, err.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  let armTimer = null;
  async function onSwitch(btn) {
    const msg = $("#switch-msg");
    if (!btn.classList.contains("armed")) {
      btn.classList.add("armed");
      btn.textContent = "Click again to end the game on every phone";
      armTimer = setTimeout(() => { btn.classList.remove("armed"); render(); }, 6000);
      return;
    }
    clearTimeout(armTimer);
    btn.classList.remove("armed");
    btn.disabled = true;
    try {
      await api.throwSwitch();
      flash(msg, "Switch thrown. Every phone is showing the victory screen.");
      await load();
    } catch (err) {
      flash(msg, err.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  function onClick(e) {
    const act = e.target.closest("[data-act]");
    if (act) {
      const a = act.dataset.act;
      if (a === "refresh") return load();
      if (a === "signout") return api.signOut().then(() => loginView());
      if (a === "switch") return onSwitch(act);
      if (a === "close") return openDetail(selected);
    }
    const row = e.target.closest("#fam-rows tr");
    if (row) openDetail(row.dataset.code);
  }
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", (e) => {
    const row = e.target.closest && e.target.closest("#fam-rows tr");
    if (row && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDetail(row.dataset.code); }
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && pollTimer) load(); });

  // ---------- start ----------
  async function start() {
    shell();
    await load();
    startPolling();
  }

  async function boot() {
    const wantMock = /[?&]mock\b/.test(location.search) && C.demoTools;
    if (wantMock) api = mockApi();
    else if (C.supabaseUrl && C.supabaseAnonKey && window.supabase) api = supabaseApi();
    else return noServerView();
    const session = await api.session().catch(() => null);
    if (session) start();
    else loginView();
  }
  boot();
})();
