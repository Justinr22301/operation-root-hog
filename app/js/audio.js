// Sound for Station ARCO: radio static, Morse code, a relay chime, and read-aloud.
// Everything is generated on the phone, so it works with no signal.
(function () {
  let ctx = null;
  let current = [];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function stop() {
    playId++;
    current.forEach((n) => {
      try { n.stop(); } catch (e) { /* already stopped */ }
    });
    current = [];
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (fileAudio) { fileAudio.pause(); fileAudio = null; }
  }

  function staticBurst(seconds = 1.2, volume = 0.18) {
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / 900));
    const src = c.createBufferSource();
    src.buffer = buf;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1800;
    band.Q.value = 0.7;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + seconds);
    src.connect(band).connect(gain).connect(c.destination);
    src.start();
    current.push(src);
  }

  function tone(freq, start, duration, volume = 0.22) {
    const c = ensure();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.006);
    gain.gain.setValueAtTime(volume, start + duration - 0.006);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + duration + 0.01);
    current.push(osc);
  }

  const MORSE = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
    K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
    U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  };

  // Plays text as Morse. Slow enough for kids with a card: about 8 words a minute,
  // with extra space between letters. Returns the length in seconds.
  function morse(text, unit = 0.15) {
    const c = ensure();
    if (!c) return 0;
    stop();
    let t = c.currentTime + 0.3;
    const start = t;
    for (const ch of String(text).toUpperCase()) {
      if (ch === " ") { t += unit * 7; continue; }
      const code = MORSE[ch];
      if (!code) continue;
      for (const sym of code) {
        const d = sym === "." ? unit : unit * 3;
        tone(640, t, d);
        t += d + unit;
      }
      t += unit * 5; // letter gap, stretched for beginners
    }
    return t - start;
  }

  function chime() {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + 0.02;
    tone(523.25, t, 0.16, 0.18);
    tone(659.25, t + 0.14, 0.16, 0.18);
    tone(783.99, t + 0.28, 0.32, 0.2);
  }

  function buzz() {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + 0.02;
    tone(180, t, 0.22, 0.16);
  }

  const VOICES = {
    badguys: { pitch: 0.4, rate: 0.85 },
    operator: { pitch: 1.0, rate: 0.95 },
    gobbles: { pitch: 1.3, rate: 0.95 },
    junior: { pitch: 1.1, rate: 0.88 },
  };

  // Each new sound bumps this, so a stopped or replaced voice never reports "done".
  let playId = 0;

  // Reads text aloud. Long text is spoken a sentence or two at a time, because some browsers
  // cut off a single long utterance. onDone runs once, after the last piece finishes.
  function speak(text, voice = "operator", onDone) {
    if (!window.speechSynthesis) return false;
    window.speechSynthesis.cancel();
    const my = ++playId;
    const v = VOICES[voice] || VOICES.operator;
    const pieces = String(text).replace(/\n+/g, " ").match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g) || [String(text)];
    const chunks = [];
    for (const p of pieces) {
      if (chunks.length && (chunks[chunks.length - 1] + p).length < 160) chunks[chunks.length - 1] += p;
      else chunks.push(p);
    }
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c.trim());
      u.pitch = v.pitch;
      u.rate = v.rate;
      u.lang = "en-US";
      if (i === chunks.length - 1) {
        const finish = () => { if (my === playId && onDone) onDone(); };
        u.onend = finish;
        u.onerror = finish;
      }
      window.speechSynthesis.speak(u);
    });
    return true;
  }

  let fileAudio = null;
  // Plays a recorded file if one is set, otherwise reads the text aloud. onDone runs when it finishes.
  // Recordings play through the sound engine (the same one as the static and chimes). Phones only let a page start
  // sound by itself, with no tap, on an engine a tap has already switched on. A plain <audio> started from a timer
  // (a Bad Guys break-in, the next briefing scene) is blocked on iPhones.
  const buffers = {};
  function preload(file) {
    const c = ensure();
    if (!file || !c || !window.fetch) return Promise.reject(new Error("no sound engine"));
    if (!buffers[file]) {
      buffers[file] = fetch(file)
        .then((r) => { if (!r.ok) throw new Error("missing"); return r.arrayBuffer(); })
        .then((data) => new Promise((ok, bad) => c.decodeAudioData(data, ok, bad)));
      buffers[file].catch(() => { delete buffers[file]; });
    }
    return buffers[file];
  }

  function play(file, text, voice, onDone) {
    stop();
    if (!file) return speak(text, voice, onDone);
    const my = ++playId;
    const older = () => {
      if (my !== playId) return;
      fileAudio = new Audio(file);
      fileAudio.onended = () => { if (my === playId && onDone) onDone(); };
      fileAudio.play().catch(() => { if (my === playId) speak(text, voice, onDone); });
    };
    preload(file).then((buf) => {
      if (my !== playId) return;
      const c = ensure();
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.onended = () => { if (my === playId && onDone) onDone(); };
      src.start();
      current.push(src);
    }).catch(older);
    return true;
  }

  // A low electrical hum under the briefing. Separate from stop(), so it keeps going between scenes.
  let humNodes = null;
  function hum(on, volume = 0.035) {
    const c = ensure();
    if (!c) return;
    if (!on) {
      if (humNodes) {
        const h = humNodes; humNodes = null;
        h.gain.gain.setTargetAtTime(0, c.currentTime, 0.25);
        setTimeout(() => h.oscs.forEach((o) => { try { o.stop(); } catch (e) { /* done */ } }), 1200);
      }
      return;
    }
    if (humNodes) { humNodes.gain.gain.setTargetAtTime(volume, c.currentTime, 0.4); return; }
    const gain = c.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(volume, c.currentTime, 0.6);
    const low = c.createBiquadFilter();
    low.type = "lowpass"; low.frequency.value = 260;
    low.connect(gain).connect(c.destination);
    const oscs = [[60, "sawtooth", 0.5], [120, "sine", 0.8], [180.6, "sine", 0.25]].map(([f, type, level]) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = level;
      o.connect(g).connect(low); o.start();
      return o;
    });
    humNodes = { gain, oscs };
  }

  // One teletype tick, for text typing onto the screen.
  function tick(volume = 0.05) {
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * 0.012);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2200;
    const g = c.createGain(); g.gain.value = volume;
    src.connect(hp).connect(g).connect(c.destination);
    src.start();
  }

  // The power winding down: a falling groan.
  function powerDown(seconds = 2.6, volume = 0.13) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain(); const low = c.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(210, t);
    o.frequency.exponentialRampToValueAtTime(28, t + seconds);
    low.type = "lowpass"; low.frequency.setValueAtTime(1400, t); low.frequency.exponentialRampToValueAtTime(120, t + seconds);
    g.gain.setValueAtTime(volume, t);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    o.connect(low).connect(g).connect(c.destination);
    o.start(t); o.stop(t + seconds + 0.05);
    current.push(o);
  }

  // A heavy thud, for stamps and the master switch.
  function thud(volume = 0.5) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.32);
  }

  window.GAMEAUDIO = { ensure, stop, staticBurst, morse, chime, buzz, speak, play, preload, hum, tick, powerDown, thud };
})();
