/* Atelier Filo — script comune a tutte le pagine */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Orari di esempio: 0 = domenica. [apertura, chiusura] in minuti */
  var SCHEDULE = {
    0: null,
    1: null,
    2: [540, 1140],
    3: [540, 1140],
    4: [540, 1140],
    5: [540, 1140],
    6: [510, 1080]
  };
  var DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

  function fmt(min) {
    return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0");
  }

  window.AF = { schedule: SCHEDULE, dayNames: DAY_NAMES, fmt: fmt, reduce: reduce };

  /* ---------- Testata ---------- */
  var mast = document.querySelector("[data-mast]");
  function onScrollMast() {
    if (mast) mast.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScrollMast, { passive: true });
  onScrollMast();

  /* ---------- Indice (menu) ---------- */
  var menu = document.querySelector("[data-menu]");
  var openBtn = document.querySelector("[data-menu-open]");
  var lastFocus = null;

  function focusables() {
    return menu.querySelectorAll("a[href], button:not([disabled])");
  }
  function openMenu() {
    lastFocus = document.activeElement;
    menu.classList.add("is-open");
    document.body.classList.add("is-locked");
    openBtn.setAttribute("aria-expanded", "true");
    var close = menu.querySelector(".index__close");
    setTimeout(function () { close.focus(); }, 30);
  }
  function closeMenu(restore) {
    if (!menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    openBtn.setAttribute("aria-expanded", "false");
    if (restore !== false && lastFocus) lastFocus.focus();
  }
  if (menu && openBtn) {
    openBtn.addEventListener("click", openMenu);
    menu.querySelectorAll("[data-menu-close]").forEach(function (el) {
      el.addEventListener("click", function () { closeMenu(); });
    });
    menu.querySelectorAll(".index__list a, .index__foot a").forEach(function (a) {
      a.addEventListener("click", function () { closeMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (!menu.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        closeMenu();
      } else if (e.key === "Tab") {
        var f = focusables();
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    window.matchMedia("(min-width: 64em)").addEventListener("change", function (m) {
      if (m.matches) closeMenu(false);
    });
  }

  /* ---------- Comparse allo scroll ---------- */
  var risers = document.querySelectorAll(".rise, .unveil");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    risers.forEach(function (el) { io.observe(el); });
  } else {
    risers.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Orari: la riga di oggi ---------- */
  var hours = document.querySelector("[data-hours]");
  if (hours) {
    var now = new Date();
    var d = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    hours.querySelectorAll("[data-day]").forEach(function (row) {
      if (row.getAttribute("data-day").split(" ").indexOf(String(d)) > -1) row.classList.add("is-today");
    });
    var out = document.querySelector("[data-hours-today]");
    if (out) {
      var today = SCHEDULE[d];
      var msg;
      if (today && mins >= today[0] && mins < today[1]) {
        msg = "Adesso siamo aperti, fino alle " + fmt(today[1]) + ".";
      } else if (today && mins < today[0]) {
        msg = "Oggi apriamo alle " + fmt(today[0]) + ".";
      } else {
        for (var i = 1; i <= 7; i++) {
          var nd = (d + i) % 7;
          if (SCHEDULE[nd]) {
            msg = "Adesso siamo chiusi. Riapriamo " + (i === 1 ? "domani" : DAY_NAMES[nd]) + " alle " + fmt(SCHEDULE[nd][0]) + ".";
            break;
          }
        }
      }
      out.textContent = msg;
      out.hidden = false;
    }
  }

  /* ---------- Il filo: un capello che scende lungo la pagina ---------- */
  var start = document.querySelector("[data-hair-start]");
  if (!start || !document.createElementNS) return;

  /* Forme in un riquadro 0–100. Ogni forma entra dall'alto. */
  var GLYPHS = {
    ricciolo: [[50, 0],
      [50, 20, 88, 22, 86, 50], [84, 76, 52, 84, 38, 72], [24, 60, 34, 40, 50, 42],
      [64, 44, 64, 62, 52, 63], [42, 64, 42, 52, 49, 51], [58, 50, 34, 82, 50, 100]],
    f: [[55, 0],
      [55, 8, 82, 4, 77, 16], [72, 28, 56, 26, 54, 40], [53, 45, 53, 48, 53, 50],
      [62, 47, 76, 46, 78, 50], [74, 56, 60, 55, 53, 52], [52, 66, 50, 80, 42, 92],
      [36, 102, 22, 98, 26, 88], [30, 78, 48, 80, 54, 90], [58, 96, 54, 100, 52, 100]],
    nodo: [[50, 0],
      [50, 25, 90, 35, 82, 58], [74, 80, 32, 74, 34, 52], [36, 32, 74, 40, 62, 72],
      [56, 88, 50, 92, 50, 100]],
    forbici: [[50, 0],
      [48, 6, 36, 4, 28, 8], [14, 14, 16, 32, 30, 32], [42, 32, 44, 16, 34, 12],
      [44, 30, 64, 62, 84, 96], [78, 98, 70, 90, 62, 76], [56, 64, 52, 54, 52, 46],
      [54, 34, 62, 24, 72, 14], [84, 8, 94, 24, 82, 32], [72, 38, 62, 32, 68, 24],
      [56, 46, 38, 72, 16, 96], [26, 104, 42, 96, 50, 100]],
    onda: [[50, 0],
      [95, 12, 95, 38, 50, 50], [5, 62, 5, 88, 50, 100]],
    firma: [[0, 0],
      [4, 40, 2, 80, 16, 82], [40, 86, 70, 66, 96, 76], [102, 79, 98, 98, 88, 92]]
  };

  var NS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "hair");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  var defs = document.createElementNS(NS, "defs");
  var clipHalo = document.createElementNS(NS, "clipPath");
  clipHalo.id = "hair-halo-clip";
  var clipDark = document.createElementNS(NS, "clipPath");
  clipDark.id = "hair-dark-clip";
  defs.appendChild(clipHalo);
  defs.appendChild(clipDark);
  svg.appendChild(defs);

  function mk(cls, clip) {
    var p = document.createElementNS(NS, "path");
    p.setAttribute("class", cls);
    if (clip) p.setAttribute("clip-path", "url(#" + clip + ")");
    svg.appendChild(p);
    return p;
  }
  var halo = mk("hair__halo", "hair-halo-clip");
  var line = mk("hair__line");
  var lineDark = mk("hair__line hair__line--light", "hair-dark-clip");
  lineDark.style.stroke = "var(--copper-light)";
  var tip = document.createElementNS(NS, "circle");
  tip.setAttribute("class", "hair__tip");
  tip.setAttribute("r", "3.2");
  svg.appendChild(tip);
  document.body.insertBefore(svg, document.body.firstChild);

  var paths = [halo, line, lineDark];
  var total = 0;
  var samples = [];
  var maxY = [];
  var STEP = 12;
  var current = 0;
  var target = 0;
  var raf = 0;
  var built = false;

  function docBox(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  function rects(clip, selector) {
    while (clip.firstChild) clip.removeChild(clip.firstChild);
    document.querySelectorAll(selector).forEach(function (el) {
      var b = docBox(el);
      if (!b.w || !b.h) return;
      var rc = document.createElementNS(NS, "rect");
      rc.setAttribute("x", b.x);
      rc.setAttribute("y", b.y);
      rc.setAttribute("width", b.w);
      rc.setAttribute("height", b.h);
      clip.appendChild(rc);
    });
  }

  function build() {
    var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    svg.style.height = docH + "px";
    svg.setAttribute("viewBox", "0 0 " + document.documentElement.clientWidth + " " + docH);
    svg.setAttribute("width", document.documentElement.clientWidth);

    var vw = document.documentElement.clientWidth;
    var railX = vw - Math.max(6, Math.min(24, vw * 0.02));
    var s = docBox(start);
    var cx = s.x, cy = s.y;
    var d = "M" + r1(cx) + " " + r1(cy);
    var anchors = Array.prototype.slice.call(document.querySelectorAll("[data-hair]"))
      .map(function (el) { return { el: el, b: docBox(el), g: GLYPHS[el.getAttribute("data-hair")] }; })
      .filter(function (a) { return a.g && a.b.w > 0 && a.b.h > 0 && a.b.y > cy; })
      .sort(function (a, b) { return a.b.y - b.b.y; });

    anchors.forEach(function (a) {
      var b = a.b;
      function P(px, py) { return [b.x + (px / 100) * b.w, b.y + (py / 100) * b.h]; }
      var e = P(a.g[0][0], a.g[0][1]);
      var gap = e[1] - cy;
      if (gap > 320) {
        /* Tratto lungo: il filo corre sul margine destro, lontano dal testo */
        d += " C" + r1(cx) + " " + r1(cy + 70) + " " + r1(railX) + " " + r1(cy + 40) + " " + r1(railX) + " " + r1(cy + 150) +
          " L" + r1(railX) + " " + r1(e[1] - 150) +
          " C" + r1(railX) + " " + r1(e[1] - 40) + " " + r1(e[0]) + " " + r1(e[1] - 70) + " " + r1(e[0]) + " " + r1(e[1]);
      } else {
        var dy = Math.max(40, gap * 0.5);
        d += " C" + r1(cx) + " " + r1(cy + dy) + " " + r1(e[0]) + " " + r1(e[1] - dy) + " " + r1(e[0]) + " " + r1(e[1]);
      }
      for (var i = 1; i < a.g.length; i++) {
        var sg = a.g[i];
        var c1 = P(sg[0], sg[1]), c2 = P(sg[2], sg[3]), p = P(sg[4], sg[5]);
        d += " C" + r1(c1[0]) + " " + r1(c1[1]) + " " + r1(c2[0]) + " " + r1(c2[1]) + " " + r1(p[0]) + " " + r1(p[1]);
        cx = p[0];
        cy = p[1];
      }
    });

    paths.forEach(function (p) { p.setAttribute("d", d); });
    total = line.getTotalLength();
    samples = [];
    maxY = [];
    var m = -Infinity;
    for (var L = 0; L <= total; L += STEP) {
      var pt = line.getPointAtLength(L);
      samples.push([pt.x, pt.y]);
      m = Math.max(m, pt.y);
      maxY.push(m);
    }
    paths.forEach(function (p) {
      p.style.strokeDasharray = total + " " + (total + 10);
    });
    rects(clipHalo, "[data-hair-halo]");
    rects(clipDark, ".on-dark");
    built = true;
  }

  function lengthForY(y) {
    var lo = 0, hi = maxY.length - 1;
    if (!maxY.length) return 0;
    if (y >= maxY[hi]) return total;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (maxY[mid] > y) hi = mid; else lo = mid + 1;
    }
    return lo * STEP;
  }

  function paint() {
    var off = Math.max(0, total - current);
    paths.forEach(function (p) { p.style.strokeDashoffset = off; });
    var i = Math.min(samples.length - 1, Math.round(current / STEP));
    if (samples[i]) {
      tip.setAttribute("cx", samples[i][0]);
      tip.setAttribute("cy", samples[i][1]);
      tip.style.opacity = current > 2 && current < total - 2 ? 1 : 0;
    }
  }

  function loop() {
    var diff = target - current;
    if (Math.abs(diff) < 0.5) {
      current = target;
      paint();
      raf = 0;
      return;
    }
    current += diff * 0.12;
    paint();
    raf = requestAnimationFrame(loop);
  }

  function update() {
    if (!built) return;
    if (reduce) {
      current = target = total;
      paint();
      return;
    }
    var y = window.scrollY + window.innerHeight * 0.62;
    target = Math.max(lengthForY(y), firstStop);
    if (!raf) raf = requestAnimationFrame(loop);
  }

  var firstStop = 0;
  function rebuild() {
    var ratio = total ? current / total : 0;
    build();
    current = ratio * total;
    var first = document.querySelector("[data-hair]");
    if (first) {
      var fb = docBox(first);
      firstStop = Math.min(lengthForY(fb.y + fb.h), total);
    }
    paint();
    update();
  }

  rebuild();
  window.addEventListener("scroll", update, { passive: true });

  var lastW = window.innerWidth;
  var lastH = 0;
  var t;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(function () {
      var h = document.documentElement.scrollHeight;
      if (window.innerWidth !== lastW || h !== lastH) {
        lastW = window.innerWidth;
        lastH = h;
        rebuild();
      }
    }, 160);
  }
  window.addEventListener("resize", schedule);
  window.addEventListener("load", function () { lastH = 0; schedule(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastH = 0; schedule(); });
  if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(document.body);
})();
