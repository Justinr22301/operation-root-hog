// Two backends with the same methods:
//   DemoBackend     - everything stays on this phone (no server). For trying the game.
//   SupabaseBackend - the real game: teams, answers, broadcasts and locations on Supabase.
(function () {
  const CODE_LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

  function makeCode(len = 6) {
    let out = "";
    const rnd = new Uint32Array(len);
    (window.crypto || window.msCrypto).getRandomValues(rnd);
    for (let i = 0; i < len; i++) out += CODE_LETTERS[rnd[i] % CODE_LETTERS.length];
    return out;
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Moore first or last at random, Arco stops shuffled, so each route crosses between towns once.
  function buildRoute() {
    const arco = shuffle(GAME.relays.filter((r) => r.cluster === "arco").map((r) => r.id));
    const moore = GAME.relays.filter((r) => r.cluster === "moore").map((r) => r.id);
    return Math.random() < 0.5 ? moore.concat(arco) : arco.concat(moore);
  }

  function isJunior(agent) {
    return Number(agent.age) > 0 && Number(agent.age) < 8;
  }

  // A stand-in Family Relay for demo mode. On game day you write each family's clue yourself.
  function demoFamilyClue(team) {
    const juniors = (team.agents || []).filter(isJunior).length;
    const year = parseInt(team.facts && team.facts.weddingYear, 10);
    if (year > 1900) {
      return {
        text:
          "Two agents in your car joined forces in the year you need. Add the number of junior agents riding along, or the Summit goes stale.",
        answer: String(year + juniors),
      };
    }
    const pet = (team.facts && team.facts.pet) || "";
    if (pet) {
      const shifted = pet.toUpperCase().replace(/[A-Z]/g, (ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + 1) % 26) + 65));
      return {
        text: "Take the name of your family's pet. Move every letter one step forward on your decoder wheel. A becomes B, Z becomes A.",
        answer: shifted,
      };
    }
    return { text: "Spell your team name backwards.", answer: team.name.split("").reverse().join("") };
  }

  function publicTeam(t) {
    return {
      code: t.code,
      name: t.name,
      level: t.level,
      agents: t.agents,
      route: t.route.slice(),
      tracking: !!t.tracking,
      familyClue: t.familyClue ? t.familyClue.text : null,
      familyHash: t.familyClue ? answerHash(t.familyClue.answer) : null,
      solves: t.solves || {},
      started: demoStarted(),
    };
  }

  // Demo mode keeps the game-start switch on this phone too.
  function demoStarted() {
    try { return localStorage.getItem("roothog.demo.started") === "true"; } catch (e) { return false; }
  }

  class DemoBackend {
    constructor() {
      this.kind = "demo";
      this.key = "roothog.demo.teams";
    }
    _all() {
      try { return JSON.parse(localStorage.getItem(this.key) || "{}"); } catch (e) { return {}; }
    }
    _save(all) {
      try { localStorage.setItem(this.key, JSON.stringify(all)); } catch (e) { /* storage full or blocked */ }
    }
    async createTeam(form) {
      const all = this._all();
      let code = makeCode();
      while (all[code]) code = makeCode();
      const team = {
        code,
        name: form.name,
        level: form.level,
        agents: form.agents,
        facts: form.facts,
        tracking: form.tracking,
        route: buildRoute(),
        lockCode: String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
        solves: {},
      };
      team.familyClue = demoFamilyClue(team);
      all[code] = team;
      this._save(all);
      return publicTeam(team);
    }
    async joinTeam(code) {
      const t = this._all()[String(code).toUpperCase().trim()];
      if (!t) throw new Error("No team uses that code. Check the code on the first phone and try again.");
      const out = publicTeam(t);
      out.digits = t.lockCode.slice(0, Math.floor(Object.keys(t.solves).length / 2));
      return out;
    }
    async recordSolve(code, relayId, detail) {
      const all = this._all();
      const t = all[code];
      if (!t) throw new Error("Team not found");
      t.solves[relayId] = { at: Date.now(), hints: detail.hints, map: detail.map, juniorFirstTry: detail.juniorFirstTry };
      this._save(all);
      return { digits: t.lockCode.slice(0, Math.floor(Object.keys(t.solves).length / 2)) };
    }
    async postLocation() { /* demo: nothing to send */ }
    subscribe(code, onMessage) {
      window.addEventListener("roothog:broadcast", (e) => onMessage(e.detail));
    }
    testBroadcast(detail) {
      window.dispatchEvent(new CustomEvent("roothog:broadcast", { detail }));
    }
    setStarted(on) {
      try { localStorage.setItem("roothog.demo.started", on ? "true" : "false"); } catch (e) { /* blocked */ }
    }
  }

  class SupabaseBackend {
    constructor(url, key) {
      this.kind = "supabase";
      this.client = window.supabase.createClient(url, key, { auth: { persistSession: false } });
    }
    async _rpc(name, args) {
      let res;
      try {
        res = await this.client.rpc(name, args);
      } catch (e) {
        const err = new Error("No connection");
        err.offline = true;
        throw err;
      }
      if (res.error) {
        const msg = res.error.message || "Something went wrong";
        const err = new Error(msg);
        if (/fetch|network|Failed to fetch|Load failed/i.test(msg)) err.offline = true;
        throw err;
      }
      return res.data;
    }
    async createTeam(form) {
      return this._rpc("create_team", {
        p_name: form.name,
        p_level: form.level,
        p_agents: form.agents,
        p_facts: form.facts,
        p_tracking: !!form.tracking,
        p_route: buildRoute(),
      });
    }
    async joinTeam(code) {
      return this._rpc("join_team", { p_code: String(code).toUpperCase().trim() });
    }
    async recordSolve(code, relayId, detail) {
      return this._rpc("record_solve", {
        p_code: code,
        p_relay: relayId,
        p_main: detail.main,
        p_junior: detail.junior == null ? null : String(detail.junior),
        p_hints: detail.hints || 0,
        p_map: !!detail.map,
        p_junior_first_try: !!detail.juniorFirstTry,
      });
    }
    async postLocation(code, pos) {
      return this._rpc("post_location", {
        p_code: code,
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
        p_accuracy: pos.coords.accuracy,
      });
    }
    subscribe(code, onMessage) {
      this.client
        .channel("broadcasts")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcasts" }, (payload) => {
          const row = payload.new || {};
          if (!row.team_code || row.team_code === code) onMessage(row);
        })
        .subscribe();
    }
    // Short-lived signals from the TV briefing to every phone (nothing is stored): the Bad Guys' takeover.
    onRoom(onHijack) {
      this.client
        .channel("room")
        .on("broadcast", { event: "hijack" }, (msg) => onHijack(!!(msg.payload && msg.payload.on)))
        .subscribe();
    }
  }

  window.makeBackend = function () {
    const c = window.CONFIG || {};
    if (c.supabaseUrl && c.supabaseAnonKey && window.supabase) return new SupabaseBackend(c.supabaseUrl, c.supabaseAnonKey);
    return new DemoBackend();
  };
  window.isJuniorAgent = isJunior;
})();
