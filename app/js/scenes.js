// Pictures for the briefing, one per scene, drawn in SVG so they work offline and need no image files.
// To use a real photo instead (for example Ambassador Gobbles from 2024), put it in app/img/ and set
// `image: "img/gobbles.jpg"` on that scene in content.js. The drawing is then skipped.
// Animation classes (pop, rise, light-on, light-off, blink, wave, slam, flicker) live in app.css.
(function () {
  const YEL = "#f2c318", BLUE = "#1c4c9e", RED = "#c1392b", LAVA = "#2d2a27", LIME = "#e6e3dc", DIM = "#4a4541";

  const d = (s) => `style="--d:${s}s"`;

  // A small atom, used for relays and emblems.
  const atom = (x, y, r, color, extra = "") =>
    `<g ${extra} transform="translate(${x} ${y})"><g fill="none" stroke="${color}" stroke-width="${r / 7}">` +
    `<ellipse rx="${r}" ry="${r * 0.38}"/><ellipse rx="${r}" ry="${r * 0.38}" transform="rotate(60)"/><ellipse rx="${r}" ry="${r * 0.38}" transform="rotate(120)"/></g>` +
    `<circle r="${r * 0.2}" fill="${color}"/></g>`;

  // A row of small-town buildings with lit windows.
  function town(y, windowClass, startDelay, step, sky = "") {
    const blds = [
      [10, 46, 40], [58, 30, 56], [94, 52, 34], [150, 44, 64], [198, 34, 46], [236, 54, 38], [294, 26, 50],
    ];
    let out = sky;
    let k = 0;
    for (const [x, w, h] of blds) {
      out += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${LAVA}"/>`;
      for (let wy = y - h + 8; wy < y - 10; wy += 14) {
        for (let wx = x + 6; wx < x + w - 8; wx += 12) {
          out += `<rect x="${wx}" y="${wy}" width="6" height="7" class="${windowClass}" ${d(startDelay + (k++ % 9) * step)}/>`;
        }
      }
    }
    return out;
  }

  // A picture from img/, cropped by a viewBox. crop is "x y w h" in the picture's own pixels.
  // gobbles.webp is 700 x 766 (head near 362, 134); count.webp is 600 x 705; council.webp is 1000 x 563.
  const SIZES = { gobbles: [700, 766], count: [600, 705], council: [1000, 563] };
  const picture = (name, x, y, w, h, crop, cls = "") =>
    `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${crop}" preserveAspectRatio="xMidYMid slice">` +
    `<image href="img/${name}.webp" width="${SIZES[name][0]}" height="${SIZES[name][1]}" class="${cls}"/></svg>`;

  const SCENES = {
    // The opening: Station ARCO's radio tuning in.
    radio: `<svg viewBox="0 0 320 180" role="img" aria-label="A radio tuning in to Station ARCO">
      <defs>
        <clipPath id="sc-dial"><rect x="78" y="50" width="164" height="36" rx="3"/></clipPath>
        <radialGradient id="sc-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${YEL}" stop-opacity=".35"/><stop offset="1" stop-color="${YEL}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="180" fill="#23282a"/>
      <rect x="0" y="122" width="320" height="1.5" fill="#3a3f40"/>
      <text x="14" y="24" font-family="Overpass, sans-serif" font-weight="800" font-size="13" fill="${YEL}" class="blink-slow">INCOMING TRANSMISSION</text>
      <circle cx="306" cy="19" r="4" fill="${RED}" class="blink"/>
      <ellipse cx="160" cy="68" rx="110" ry="40" fill="url(#sc-glow)" class="pulse"/>
      <g class="rise">
        <rect x="62" y="36" width="196" height="118" rx="14" fill="#151817"/>
        <rect x="66" y="40" width="188" height="110" rx="11" fill="#5a5d52"/>
        <rect x="78" y="50" width="164" height="36" rx="3" fill="#141815"/>
        <g clip-path="url(#sc-dial)">
          ${Array.from({ length: 33 }, (_, i) => `<rect x="${82 + i * 4.9}" y="54" width="0.8" height="${i % 5 === 0 ? 14 : 8}" fill="${YEL}" opacity=".85"/>`).join("")}
          <g class="wave-scroll"><path d="${Array.from({ length: 12 }, (_, i) => `M${70 + i * 40} 76 h14 l4 -9 l5 17 l5 -22 l5 14 h7`).join(" ")}" fill="none" stroke="${YEL}" stroke-width="1.6" stroke-linejoin="round" class="wave-amp"/></g>
          <rect x="0" y="50" width="2" height="36" fill="${RED}" class="needle"/>
        </g>
        <g transform="translate(97 118)"><circle r="14" fill="#262923" stroke="#b9b39f" stroke-width="2.5"/><rect x="-1.4" y="-10" width="2.8" height="8" rx="1" fill="${YEL}" class="knob"/></g>
        <g transform="translate(223 118)"><circle r="14" fill="#262923" stroke="#b9b39f" stroke-width="2.5"/><rect x="-1.4" y="-10" width="2.8" height="8" rx="1" fill="${YEL}" class="knob knob-2"/></g>
        <g fill="#2b2e29">${Array.from({ length: 7 }, (_, i) => `<rect x="125" y="${104 + i * 4.4}" width="70" height="2"/>`).join("")}</g>
        <circle cx="160" cy="94" r="2" fill="#7cf08a" class="blink"/>
      </g>
      <text x="160" y="172" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="10" fill="${YEL}" letter-spacing=".08em">STATION ARCO</text>
    </svg>`,

    // The Bad Guys break in on the frequency.
    badguys: `<svg viewBox="0 0 320 180" role="img" aria-label="The Bad Guys, in silhouette">
      <defs><radialGradient id="sc-red" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#e0533f"/><stop offset="1" stop-color="#4a100c"/></radialGradient></defs>
      <rect width="320" height="180" fill="url(#sc-red)"/>
      <g fill="#000" opacity=".16">${Array.from({ length: 11 }, (_, i) => `<rect y="${i * 17}" width="320" height="7"/>`).join("")}</g>
      <defs><radialGradient id="sc-spot" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd9c9" stop-opacity=".55"/><stop offset="1" stop-color="#ffd9c9" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="0" cy="96" rx="70" ry="100" fill="url(#sc-spot)" class="spot"/>
      <ellipse cx="160" cy="177" rx="150" ry="9" fill="#000" opacity=".45"/>
      <g class="glitch"><g class="rise"><g class="breathe">
        <image href="img/badguys.webp" x="31" y="8" width="258" height="172"/>
        ${/* eye spots measured on the picture: 31 + x * 0.2867, 8 + y * 0.2867 */ ""}
        ${[[63.1, 71.1, 2.2], [103.5, 53.9, 2.6], [158.9, 30.9, 1.6], [217.3, 45.6, 3.1], [259.5, 74.8, 3.6]]
          .map(([x, y, t]) => `<g class="glint" style="--d:${t}s" fill="${RED}"><rect x="${x - 4}" y="${y}" width="3" height="1.1" rx=".5"/><rect x="${x + 1}" y="${y}" width="3" height="1.1" rx=".5"/></g>`)
          .join("")}
      </g></g></g>
      <g class="flicker" fill="#fff" opacity=".5">${Array.from({ length: 9 }, (_, i) => `<rect x="${(i * 53) % 300}" y="${(i * 37) % 170}" width="${20 + ((i * 29) % 60)}" height="1"/>`).join("")}</g>
      <text x="12" y="20" font-family="Overpass Mono, monospace" font-size="11" fill="#fff" opacity=".85">SIGNAL HIJACKED</text>
      <circle cx="306" cy="16" r="5" fill="#fff" class="blink"/>
    </svg>`,

    // Noon: the power goes out across Arco.
    blackout: `<svg viewBox="0 0 320 180" role="img" aria-label="Arco's lights going out at noon">
      <rect width="320" height="180" fill="#9fb3c8"/>
      <rect width="320" height="180" fill="#2d3340" class="dusk"/>
      <path d="M0 130 Q60 92 120 116 T240 104 T320 112 V180 H0z" fill="#6f665c"/>
      ${town(164, "light-off", 1.5, 0.55)}
      <rect y="164" width="320" height="16" fill="#1d1b19"/>
      <g transform="translate(276 38)">
        <circle r="24" fill="${LIME}" stroke="${LAVA}" stroke-width="3"/>
        ${Array.from({ length: 12 }, (_, i) => `<rect x="-1" y="-21" width="2" height="4" fill="${LAVA}" transform="rotate(${i * 30})"/>`).join("")}
        <rect x="-1.6" y="-16" width="3.2" height="16" rx="1.6" fill="${RED}"/>
        <rect x="-1.2" y="-19" width="2.4" height="19" rx="1.2" fill="${LAVA}"/>
        <circle r="2.4" fill="${LAVA}"/>
      </g>
      <text x="276" y="80" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="11" fill="${LIME}">12:00</text>
    </svg>`,

    // Station ARCO calling.
    station: `<svg viewBox="0 0 320 180" role="img" aria-label="The Station ARCO radio tower">
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0ee"/><stop offset="1" stop-color="#f1ede2"/></linearGradient>
        <radialGradient id="sc-beacon"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a3c" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="180" fill="url(#sc-sky)"/>
      ${/* station.webp (900 x 594) laid out 272 wide: picture point (x, y) of the 1543 x 1019 original lands at 24 + x * 0.1763, y * 0.1763 */ ""}
      ${[0, 1, 2].map((i) => `<circle cx="154.5" cy="14.8" r="10" fill="none" stroke="${BLUE}" stroke-width="2" class="ping" style="--d:${i * 0.9}s"/>`).join("")}
      <g class="rise"><image href="img/station.webp" x="24" y="0" width="272" height="180"/></g>
      <circle cx="154.5" cy="14.8" r="13" fill="url(#sc-beacon)" class="beacon"/>
      <circle cx="117.6" cy="127.8" r="2.2" fill="#7cf08a" class="blink" style="--d:.3s"/>
      <circle cx="117.6" cy="133.1" r="2.2" fill="${YEL}" class="blink" style="--d:.9s"/>
    </svg>`,

    // Ambassador Gobbles' 2024 case file: his portrait clipped to the Operation Feather Recovery dossier.
    gobbles: `<svg viewBox="0 0 320 180" role="img" aria-label="Ambassador Gobbles' case file from Operation Feather Recovery, 2024">
      <defs><clipPath id="sc-photo"><rect x="0" y="0" width="118" height="118"/></clipPath></defs>
      <svg width="320" height="180" viewBox="0 120 800 450" preserveAspectRatio="xMidYMid slice"><image href="img/dossier.webp" width="800" height="800" class="kb-slow"/></svg>
      <rect width="320" height="180" fill="#1b1612" opacity=".68"/>
      <g class="drop-in" ${d(0.2)}>
        <g transform="translate(46 22) rotate(-4)">
          <rect x="-7" y="-7" width="132" height="150" fill="#f7f3ea" stroke="#d8cfbd"/>
          <rect width="118" height="118" fill="#cfe0ee"/>
          <g clip-path="url(#sc-photo)">${picture("gobbles", 0, 0, 118, 118, "70 0 600 600", "kb")}</g>
          <text x="59" y="134" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="9" fill="${LAVA}">AMBASSADOR GOBBLES</text>
          <path d="M96 -14 v22 q0 6 -6 6 q-6 0 -6 -6 v-18 q0 -3 3 -3 q3 0 3 3 v16" fill="none" stroke="#a7acb1" stroke-width="2.2" stroke-linecap="round"/>
        </g>
      </g>
      <g class="type-in" ${d(0.9)}>
        <rect x="196" y="40" width="112" height="20" rx="2" fill="#f7f3ea" opacity=".95"/>
        <text x="252" y="54" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="8" fill="${LAVA}">CASE FILE · 2024</text>
        <rect x="196" y="64" width="112" height="34" rx="2" fill="#f7f3ea" opacity=".95"/>
        <text x="252" y="78" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="8" fill="${LAVA}">OPERATION</text>
        <text x="252" y="91" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="8" fill="${LAVA}">FEATHER RECOVERY</text>
      </g>
      <g class="slam" style="--x:252px;--y:128px;--d:1.8s" transform="translate(252 128)">
        <g transform="rotate(-10)">
          <rect x="-50" y="-19" width="100" height="38" rx="4" fill="#f7f3ea" opacity=".2"/>
          <rect x="-50" y="-19" width="100" height="38" rx="4" fill="none" stroke="${RED}" stroke-width="3.5"/>
          <text y="-1" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="14" fill="${RED}">RESCUED</text>
          <text y="13" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="10" fill="${RED}">BY AGENTS</text>
        </g>
      </g>
    </svg>`,

    // The Thanksgiving Peace Summit, with Gobbles in the chair.
    summit: `<svg viewBox="0 0 320 180" role="img" aria-label="Ambassador Gobbles chairing the Thanksgiving Peace Summit">
      <defs><linearGradient id="sc-hall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3ede0"/><stop offset="1" stop-color="#ddd3c0"/></linearGradient></defs>
      <rect width="320" height="180" fill="url(#sc-hall)"/>
      ${[20, 70, 250, 300].map((x) => `<rect x="${x - 6}" y="0" width="12" height="130" fill="#e6dccb"/><rect x="${x - 9}" y="0" width="18" height="6" fill="#d2c6b0"/>`).join("")}
      <g transform="translate(160 14)" class="drop-in">
        <rect x="-128" y="-10" width="256" height="20" rx="4" fill="${BLUE}"/>
        ${atom(-114, 0, 6, YEL)}${atom(114, 0, 6, YEL)}
        <text y="4" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="10" fill="${YEL}">THANKSGIVING PEACE SUMMIT</text>
      </g>
      <g class="rise" ${d(0.3)}>${picture("council", 14, 28, 292, 152, "0 30 1000 520", "kb-gentle")}</g>
    </svg>`,

    // Count Georg von Arco and his legendary relays.
    count: `<svg viewBox="0 0 320 180" role="img" aria-label="Count Georg von Arco and eight relays around the valley">
      <rect width="320" height="180" fill="${LIME}"/>
      <defs><clipPath id="sc-count"><ellipse cx="70" cy="76" rx="45" ry="57"/></clipPath></defs>
      <g class="pop">
        <ellipse cx="70" cy="76" rx="52" ry="64" fill="#c9a24a"/><ellipse cx="70" cy="76" rx="45" ry="57" fill="#efe4cc"/>
        <g clip-path="url(#sc-count)">${picture("count", 25, 19, 90, 114, "40 0 520 660", "kb-face")}</g>
      </g>
      <text x="70" y="157" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="10" fill="${LAVA}">COUNT GEORG VON ARCO</text>
      <text x="70" y="169" text-anchor="middle" font-family="Overpass Mono, monospace" font-size="9" fill="#5a5550">1869–1940</text>
      <g transform="translate(150 0)">
        <rect x="0" y="14" width="160" height="152" rx="8" fill="#f6efe0" stroke="#c8c3b9" stroke-width="2"/>
        <path d="M18 34 Q60 70 74 96 T126 150" fill="none" stroke="#8fb4f0" stroke-width="4" stroke-linecap="round"/>
        <circle cx="48" cy="52" r="5" fill="${LAVA}"/><text x="58" y="48" font-family="Overpass, sans-serif" font-weight="800" font-size="10" fill="${LAVA}">MOORE</text>
        <circle cx="98" cy="122" r="6" fill="${LAVA}"/><text x="108" y="118" font-family="Overpass, sans-serif" font-weight="800" font-size="10" fill="${LAVA}">ARCO</text>
        ${[[34, 66], [66, 40], [86, 104], [118, 132], [74, 140], [126, 98], [104, 70], [40, 120]]
          .map(([x, y], i) => `<g class="pop" ${d(0.4 + i * 0.25)}>${atom(x, y, 9, RED)}</g>`)
          .join("")}
      </g>
    </svg>`,

    // 1955: Arco lit by atomic power.
    atom1955: `<svg viewBox="0 0 320 180" role="img" aria-label="Arco lighting up from atomic power in 1955">
      <defs><linearGradient id="sc-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1a33"/><stop offset="1" stop-color="#2b3d66"/></linearGradient></defs>
      <rect width="320" height="180" fill="url(#sc-night)"/>
      <g fill="#fff">${Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 71) % 320}" cy="${(i * 23) % 70 + 6}" r="${i % 3 ? 0.9 : 1.4}"/>`).join("")}</g>
      <g class="pop">${atom(70, 46, 26, YEL)}</g>
      <circle cx="70" cy="46" r="34" fill="${YEL}" opacity=".12" class="blink"/>
      <path d="M0 140 Q80 112 160 132 T320 120 V180 H0z" fill="#1d2433"/>
      ${town(168, "light-on", 1, 0.22)}
      <rect y="168" width="320" height="12" fill="#14110f"/>
      <text x="306" y="22" text-anchor="end" font-family="Overpass Mono, monospace" font-weight="600" font-size="13" fill="${YEL}">JULY 17, 1955</text>
    </svg>`,

    // The mission: restore the relays, earn the code, throw the switch.
    mission: `<svg viewBox="0 0 320 180" role="img" aria-label="Restore eight relays, earn four digits, throw the master switch">
      <rect width="320" height="180" fill="${LIME}"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const x = 26 + i * 38.5;
        return `<g><circle cx="${x}" cy="34" r="15" fill="#d2cdc3" stroke="#a9a397" stroke-width="2.5" class="lamp-on" ${d(0.5 + i * 0.35)}/>${atom(x, 34, 9, "#8a8378")}</g>`;
      }).join("")}
      <path d="M60 64 L60 84 M260 64 L260 84" stroke="#a9a397" stroke-width="3" stroke-dasharray="4 4"/>
      <g transform="translate(110 114)">
        <path d="M-26 -20 V-34 Q-26 -56 0 -56 Q26 -56 26 -34 V-20" fill="none" stroke="#8a8378" stroke-width="8"/>
        <rect x="-44" y="-22" width="88" height="62" rx="10" fill="${YEL}" stroke="${LAVA}" stroke-width="3"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${-36 + i * 19}" y="-6" width="15" height="22" rx="3" fill="#fff" stroke="${LAVA}" stroke-width="2"/><text x="${-28.5 + i * 19}" y="11" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="14" fill="${LAVA}" class="pop" ${d(1.4 + i * 0.7)}>?</text>`).join("")}
      </g>
      <g transform="translate(232 108)">
        <rect x="-30" y="-40" width="60" height="80" rx="6" fill="${LAVA}"/>
        <rect x="-20" y="-28" width="40" height="56" rx="4" fill="#4a4541"/>
        <g class="throw" ${d(4.2)}><rect x="-4" y="-34" width="8" height="34" rx="3" fill="${RED}"/><circle cy="-34" r="8" fill="${RED}"/></g>
        <text y="54" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="10" fill="${LAVA}">MASTER SWITCH</text>
      </g>
    </svg>`,
  };

  window.SCENES = SCENES;

  // The Bad Guys taking over the broadcast: the picture tears and shifts color, static floods in,
  // "SIGNAL HIJACKED" flashes, and Operator Arco's words scramble. Calls done() when it's time to show their feed.
  // fig = the scene's <figure>, text = the words box, frame = the box whose colored edge turns red.
  window.hijack = function (fig, text, frame, done) {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !fig) return done();
    const LENGTH = 3400; // ms; the CSS animations in app.css (hijack-noise, hijack-label) are timed to match
    // The recorded glitch sound; if it can't play, fall back to made-up static.
    let glitch = null;
    if (window.GAMEAUDIO) {
      GAMEAUDIO.stop();
      glitch = new Audio("audio/briefing-glitch.mp3");
      glitch.play().catch(() => { glitch = null; GAMEAUDIO.staticBurst(LENGTH / 1000 + 0.2, 0.3); });
    }
    fig.classList.add("hijack");
    if (frame) frame.classList.add("hijack-frame");

    // Live TV static, drawn small and stretched so it looks chunky.
    const c = document.createElement("canvas");
    c.width = 160; c.height = 90; c.className = "hijack-noise";
    fig.appendChild(c);
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(c.width, c.height);
    const start = performance.now();
    let raf = 0;
    const frameNoise = (now) => {
      const d = img.data;
      const red = now - start > 900;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = red ? Math.min(255, v + 60) : v; d[i + 1] = red ? v * 0.55 : v; d[i + 2] = red ? v * 0.5 : v; d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      // a few torn bands
      for (let b = 0; b < 3; b++) {
        const y = (Math.random() * c.height) | 0;
        ctx.fillStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.4})`;
        ctx.fillRect(0, y, c.width, 2 + Math.random() * 6);
      }
      if (now - start < LENGTH + 100) raf = requestAnimationFrame(frameNoise);
    };
    raf = requestAnimationFrame(frameNoise);

    const label = document.createElement("div");
    label.className = "hijack-label";
    label.textContent = "SIGNAL HIJACKED";
    fig.appendChild(label);

    // Scramble the words a little more each tick.
    let scramble = 0;
    if (text) {
      const orig = text.textContent;
      const glyphs = "▓▒░█#%&@!?";
      let k = 0;
      scramble = setInterval(() => {
        k++;
        text.textContent = orig.replace(/\S/g, (ch) => (Math.random() < k / 16 ? glyphs[(Math.random() * glyphs.length) | 0] : ch));
        if (k >= 26) clearInterval(scramble);
      }, 120);
    }

    setTimeout(() => {
      cancelAnimationFrame(raf);
      clearInterval(scramble);
      // The recording runs longer than the takeover; fade it out under the Bad Guys' first words.
      if (glitch) {
        const g = glitch;
        const fade = setInterval(() => {
          g.volume = Math.max(0, g.volume - 0.1);
          if (g.volume <= 0) { g.pause(); clearInterval(fade); }
        }, 80);
      }
      done();
    }, LENGTH);
  };

  // The evidence board: every briefing picture as a tilted, red-framed card, like photos pinned up after a mission.
  // Spots are left %, top %, tilt in degrees, for up to 9 cards in a loose 3 x 3.
  const SPOTS = [[1, 9, -7], [35, 2, 4], [68, 8, -3], [4, 39, 5], [36, 36, -4], [67, 41, 6], [2, 70, -3], [34, 68, 5], [66, 72, -6]];
  const scenePicture = (b) => (b.image ? `<img src="${b.image}" alt="">` : SCENES[b.scene] || "");
  window.scenePicture = scenePicture;
  window.evidenceBoard = function (list, title = "Mission Briefing") {
    return `<div class="board"><h2 class="board-title">${title}</h2><div class="collage">${list
      .map((b, i) => {
        const [x, y, r] = SPOTS[i % SPOTS.length];
        return `<div class="ev" style="--x:${x}%;--y:${y}%;--r:${r}deg;--i:${i}">${scenePicture(b)}</div>`;
      })
      .join("")}</div></div>`;
  };
})();
