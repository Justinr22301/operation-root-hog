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
  function play(file, text, voice, onDone) {
    stop();
    if (file) {
      const my = ++playId;
      fileAudio = new Audio(file);
      fileAudio.onended = () => { if (my === playId && onDone) onDone(); };
      fileAudio.play().catch(() => speak(text, voice, onDone));
      return true;
    }
    return speak(text, voice, onDone);
  }

  window.GAMEAUDIO = { ensure, stop, staticBurst, morse, chime, buzz, speak, play };
})();
