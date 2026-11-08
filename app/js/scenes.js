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

  // Ambassador Gobbles. cx/cy is the middle of his body; s scales him.
  function gobbles(cx, cy, s, sash = true) {
    const feathers = [-75, -50, -25, 0, 25, 50, 75]
      .map((a, i) => `<ellipse cx="0" cy="-42" rx="13" ry="40" fill="${["#8b4a2b", RED, YEL, "#d9822b"][i % 4]}" stroke="${LAVA}" stroke-width="1.5" transform="rotate(${a})"/>`)
      .join("");
    return `<g transform="translate(${cx} ${cy}) scale(${s})">
      <g transform="translate(0 6)">${feathers}</g>
      <ellipse cx="0" cy="8" rx="32" ry="36" fill="#6b3e26" stroke="${LAVA}" stroke-width="2"/>
      ${sash ? `<path d="M-26 -12 L22 34 L30 26 L-18 -20z" fill="${BLUE}"/><circle cx="6" cy="14" r="7" fill="${YEL}" stroke="${LAVA}" stroke-width="1.5"/>` : ""}
      <path d="M-8 -26 Q0 -40 8 -26 L6 -12 L-6 -12z" fill="#c98f74"/>
      <circle cx="0" cy="-42" r="15" fill="#e3ab92" stroke="${LAVA}" stroke-width="2"/>
      <circle cx="-5" cy="-45" r="3.4" fill="#fff"/><circle cx="5" cy="-45" r="3.4" fill="#fff"/>
      <circle cx="-4.4" cy="-44.6" r="1.7" fill="${LAVA}"/><circle cx="5.6" cy="-44.6" r="1.7" fill="${LAVA}"/>
      <path d="M-4 -39 L4 -39 L0 -32z" fill="${YEL}" stroke="${LAVA}" stroke-width="1"/>
      <path d="M2 -36 Q8 -30 4 -22 Q0 -26 1 -33z" fill="${RED}"/>
      <rect x="-13" y="-60" width="26" height="4" rx="2" fill="${LAVA}"/>
      <rect x="-8" y="-78" width="16" height="19" rx="2" fill="${LAVA}"/>
      <rect x="-8" y="-64" width="16" height="3" fill="${YEL}"/>
    </g>`;
  }

  // A Bad Guy in silhouette: fedora and trench coat.
  function badGuy(cx, base, s, delay) {
    return `<g class="rise" ${d(delay)}><g transform="translate(${cx} ${base}) scale(${s})" fill="#141210">
      <path d="M-46 0 L-40 -62 Q-36 -86 0 -88 Q36 -86 40 -62 L46 0z"/>
      <path d="M-10 -88 L0 -60 L10 -88z" fill="#2b2522"/>
      <rect x="-9" y="-98" width="18" height="12"/>
      <ellipse cx="0" cy="-110" rx="16" ry="18"/>
      <rect x="-30" y="-124" width="60" height="6" rx="3"/>
      <path d="M-19 -122 L-15 -142 Q0 -148 15 -142 L19 -122z"/>
      <rect x="-7" y="-114" width="5" height="2" fill="${RED}" opacity=".9" class="blink" ${d(delay + 1.2)}/>
      <rect x="3" y="-114" width="5" height="2" fill="${RED}" opacity=".9" class="blink" ${d(delay + 1.2)}/>
    </g></g>`;
  }

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

  const SCENES = {
    // The Bad Guys break in on the frequency.
    badguys: `<svg viewBox="0 0 320 180" role="img" aria-label="The Bad Guys, in silhouette">
      <defs><radialGradient id="sc-red" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#e0533f"/><stop offset="1" stop-color="#4a100c"/></radialGradient></defs>
      <rect width="320" height="180" fill="url(#sc-red)"/>
      <g fill="#000" opacity=".16">${Array.from({ length: 11 }, (_, i) => `<rect y="${i * 17}" width="320" height="7"/>`).join("")}</g>
      ${badGuy(84, 186, 0.78, 0.3)}${badGuy(236, 186, 0.86, 0.6)}${badGuy(160, 190, 1, 0)}
      <g class="flicker" fill="#fff" opacity=".5">${Array.from({ length: 9 }, (_, i) => `<rect x="${(i * 53) % 300}" y="${(i * 37) % 170}" width="${20 + ((i * 29) % 60)}" height="1"/>`).join("")}</g>
      <text x="12" y="20" font-family="Overpass Mono, monospace" font-size="11" fill="#fff" opacity=".85">SIGNAL HIJACKED</text>
      <circle cx="306" cy="16" r="5" fill="#fff" class="blink"/>
    </svg>`,

    // Noon: the power goes out across Arco.
    blackout: `<svg viewBox="0 0 320 180" role="img" aria-label="Arco's lights going out at noon">
      <rect width="320" height="180" fill="#9fb3c8"/>
      <rect width="320" height="180" fill="#2d3340" class="dusk"/>
      <path d="M0 130 Q60 92 120 116 T240 104 T320 112 V180 H0z" fill="#6f665c"/>
      ${town(164, "light-off", 1.2, 0.18)}
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
      <rect width="320" height="180" fill="#dfe7ef"/>
      <path d="M0 150 Q80 112 160 136 T320 124 V180 H0z" fill="#8d8478"/>
      <path d="M0 166 Q90 150 180 162 T320 156 V180 H0z" fill="#6f665c"/>
      ${[0, 0.8, 1.6].map((t) => `<g class="wave" ${d(t)} fill="none" stroke="${BLUE}" stroke-width="3"><path d="M128 40 A40 40 0 0 1 128 80"/><path d="M192 40 A40 40 0 0 0 192 80" /></g>`).join("")}
      <g stroke="${LAVA}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M160 46 L136 160 M160 46 L184 160"/>
        <path d="M152 80 L168 80 M146 108 L174 108 M141 134 L179 134"/>
        <path d="M152 80 L174 108 L141 134 M168 80 L146 108 L179 134"/>
      </g>
      <circle cx="160" cy="44" r="6" fill="${RED}" class="blink"/>
      <g transform="translate(222 112)">
        <rect x="-2" y="0" width="4" height="40" fill="${LAVA}"/>
        <rect x="-52" y="-26" width="104" height="30" rx="6" fill="${YEL}" stroke="${BLUE}" stroke-width="3"/>
        <text y="-6" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="14" fill="${BLUE}">STATION ARCO</text>
      </g>
    </svg>`,

    // Ambassador Gobbles, rescued in 2024.
    gobbles: `<svg viewBox="0 0 320 180" role="img" aria-label="Ambassador Gobbles, rescued in Operation Feather Recovery, 2024">
      <rect width="320" height="180" fill="${BLUE}"/>
      <g fill="#fff" opacity=".08">${Array.from({ length: 8 }, (_, i) => `<circle cx="${20 + i * 42}" cy="${i % 2 ? 30 : 150}" r="${14 + (i % 3) * 6}"/>`).join("")}</g>
      <ellipse cx="160" cy="92" rx="84" ry="80" fill="${LIME}" stroke="${YEL}" stroke-width="6"/>
      <g class="pop">${gobbles(160, 112, 0.82)}</g>
      <rect x="78" y="150" width="164" height="22" rx="4" fill="${YEL}" stroke="${LAVA}" stroke-width="2"/>
      <text x="160" y="166" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="12" fill="${BLUE}">AMBASSADOR GOBBLES</text>
      <g class="slam" ${d(1.4)} transform="translate(258 52)">
        <g transform="rotate(-14)">
          <rect x="-46" y="-17" width="92" height="34" rx="4" fill="none" stroke="${RED}" stroke-width="3.5"/>
          <text y="-2" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="12" fill="${RED}">RESCUED</text>
          <text y="12" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="11" fill="${RED}">2024</text>
        </g>
      </g>
    </svg>`,

    // The Thanksgiving Peace Summit, with Gobbles in the chair.
    summit: `<svg viewBox="0 0 320 180" role="img" aria-label="Ambassador Gobbles chairing the Thanksgiving Peace Summit">
      <rect width="320" height="180" fill="#efe9dd"/>
      <rect x="0" y="0" width="320" height="10" fill="${BLUE}"/>
      <g transform="translate(160 30)">
        <rect x="-148" y="-16" width="296" height="32" rx="6" fill="${BLUE}"/>
        ${atom(-128, 0, 9, YEL)}${atom(128, 0, 9, YEL)}
        <text y="5" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="12.5" fill="${YEL}">THANKSGIVING PEACE SUMMIT</text>
      </g>
      ${[[52, "#7a8f5a", 0.2], [100, "#b5651d", 0.35], [220, "#6a5d8f", 0.5], [268, "#3f7f86", 0.65]]
        .map(([x, c, t]) => `<g class="pop" ${d(t)}><circle cx="${x}" cy="92" r="14" fill="#e3c3a6" stroke="${LAVA}" stroke-width="2"/><path d="M${x - 22} 130 Q${x - 20} 108 ${x} 108 Q${x + 20} 108 ${x + 22} 130z" fill="${c}" stroke="${LAVA}" stroke-width="2"/></g>`)
        .join("")}
      <g class="pop" ${d(0.9)}>${gobbles(160, 100, 0.62)}</g>
      <rect x="20" y="126" width="280" height="14" rx="3" fill="#8b5a36" stroke="${LAVA}" stroke-width="2"/>
      <path d="M30 140 V176 M290 140 V176" stroke="${LAVA}" stroke-width="5"/>
      <g transform="translate(78 120)"><path d="M-14 6 L14 6 L10 -2 L-10 -2z" fill="#d9822b" stroke="${LAVA}" stroke-width="1.5"/><path d="M-10 -2 Q0 -10 10 -2" fill="#f0c27a" stroke="${LAVA}" stroke-width="1.5"/></g>
      <g transform="translate(244 118)"><rect x="-14" y="2" width="20" height="5" rx="2" fill="#5a3a22"/><rect x="2" y="-6" width="8" height="12" rx="2" fill="#5a3a22"/></g>
    </svg>`,

    // Count Georg von Arco and his legendary relays.
    count: `<svg viewBox="0 0 320 180" role="img" aria-label="Count Georg von Arco and eight relays around the valley">
      <rect width="320" height="180" fill="${LIME}"/>
      <g transform="translate(70 76)">
        <ellipse rx="52" ry="64" fill="#c9a24a"/><ellipse rx="45" ry="57" fill="#f6efe0"/>
        <g fill="${LAVA}">
          <path d="M-36 52 Q-34 14 0 10 Q34 14 36 52z"/>
          <ellipse cx="0" cy="-12" rx="18" ry="22"/>
          <path d="M-18 -20 Q-16 -40 0 -38 Q16 -40 18 -20 Q10 -30 0 -28 Q-10 -30 -18 -20z"/>
          <path d="M-14 0 Q-6 -6 0 -2 Q6 -6 14 0 Q6 2 0 0 Q-6 2 -14 0z" fill="#f6efe0"/>
        </g>
        <path d="M-8 22 L0 34 L8 22" fill="#f6efe0"/>
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
      <g transform="translate(110 122)">
        <path d="M-26 -20 V-34 Q-26 -56 0 -56 Q26 -56 26 -34 V-20" fill="none" stroke="#8a8378" stroke-width="8"/>
        <rect x="-44" y="-22" width="88" height="62" rx="10" fill="${YEL}" stroke="${LAVA}" stroke-width="3"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${-36 + i * 19}" y="-6" width="15" height="22" rx="3" fill="#fff" stroke="${LAVA}" stroke-width="2"/><text x="${-28.5 + i * 19}" y="11" text-anchor="middle" font-family="Overpass Mono, monospace" font-weight="600" font-size="14" fill="${LAVA}" class="pop" ${d(1.4 + i * 0.7)}>?</text>`).join("")}
      </g>
      <g transform="translate(232 120)">
        <rect x="-30" y="-40" width="60" height="80" rx="6" fill="${LAVA}"/>
        <rect x="-20" y="-28" width="40" height="56" rx="4" fill="#4a4541"/>
        <g class="throw" ${d(4.2)}><rect x="-4" y="-34" width="8" height="34" rx="3" fill="${RED}"/><circle cy="-34" r="8" fill="${RED}"/></g>
        <text y="58" text-anchor="middle" font-family="Overpass, sans-serif" font-weight="800" font-size="10" fill="${LAVA}">MASTER SWITCH</text>
      </g>
    </svg>`,
  };

  window.SCENES = SCENES;
})();
