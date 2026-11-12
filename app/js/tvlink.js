// The TV's link to the game: family names for the roll call, the phone takeover during the hijack,
// and the master switch for the finale. Everything here is optional: with no connection (or no game master
// signed in on this computer) the TV still plays, it just skips the live parts.
// Add ?mock to the address to try it with made-up families.
(function () {
  const C = window.CONFIG || {};
  const mock = /[?&]mock\b/.test(location.search);
  let client = null;
  let room = null;

  if (!mock && C.supabaseUrl && C.supabaseAnonKey && window.supabase) {
    try {
      // Same sign-in as the game master console, when it's open in this browser.
      client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
        auth: { persistSession: true, storageKey: "roothog.gm.auth" },
      });
      // "room" carries short-lived signals to every phone. Nothing is stored.
      room = client.channel("room", { config: { broadcast: { self: false } } });
      room.subscribe();
    } catch (e) { client = null; }
  }

  // Team names for the roll call. Needs the game master signed in; otherwise an empty list.
  async function teams() {
    if (mock) {
      return [
        { name: "The Gravy Boats", restored: 8 }, { name: "Team Drumstick", restored: 8 }, { name: "Cranberry Crew", restored: 6 },
        { name: "The Rose Family", restored: 8 }, { name: "Pie Patrol", restored: 7 },
      ];
    }
    if (!client) return [];
    try {
      const res = await client.rpc("gm_state", {});
      if (res.error || !res.data) return [];
      return (res.data.teams || []).map((t) => ({ name: t.name, restored: t.restored || 0 }));
    } catch (e) { return []; }
  }

  // Tell every phone on the waiting screen that the Bad Guys have taken over (or let go).
  function hijackPhones(on) {
    if (!room) return;
    try { room.send({ type: "broadcast", event: "hijack", payload: { on: !!on } }); } catch (e) { /* no signal */ }
  }

  // Calls back once when the game master throws the master switch (after this page was opened).
  function onSwitch(cb) {
    if (!client) return;
    const opened = new Date().toISOString();
    let fired = false;
    const fire = () => { if (!fired) { fired = true; clearInterval(poll); cb(); } };
    client
      .channel("tv-broadcasts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcasts" }, (p) => { if (p.new && p.new.kind === "switch") fire(); })
      .subscribe();
    // In case the live feed drops, also look every few seconds.
    const poll = setInterval(async () => {
      try {
        const res = await client.from("broadcasts").select("id").eq("kind", "switch").gt("created_at", opened).limit(1);
        if (res.data && res.data.length) fire();
      } catch (e) { /* try again next time */ }
    }, 5000);
  }

  window.TVLINK = { teams, hijackPhones, onSwitch, live: !!client, mock };
})();
