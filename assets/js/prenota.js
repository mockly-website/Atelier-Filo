/* Atelier Filo — prenotazione in tre passi, riepilogo su WhatsApp */
(function () {
  "use strict";

  var form = document.querySelector("[data-book]");
  if (!form || !window.AF_SERVICES) return;

  var AF = window.AF;
  var SERV = {};
  window.AF_SERVICES.forEach(function (s) { SERV[s.id] = s; });
  var MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var DOW = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  var daysBox = form.querySelector("[data-days]");
  var slotsBox = form.querySelector("[data-slots]");
  var nameInput = form.querySelector("[data-name]");
  var noteInput = form.querySelector("[data-note]");
  var firstBox = form.querySelector("[data-first]");
  var testNote = form.querySelector("[data-test-note]");
  var sendBtn = form.querySelector("[data-send]");
  var alertBox = form.querySelector("[data-alert]");
  var done = form.querySelector("[data-done]");
  var bar = document.querySelector("[data-bar]");
  var barSum = document.querySelector("[data-bar-sum]");
  var barNext = document.querySelector("[data-bar-next]");

  var state = { day: null, time: null };

  function chosen() {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="servizio"]:checked'))
      .map(function (i) { return SERV[i.value]; });
  }
  function totalMin(list) {
    return list.reduce(function (a, s) { return a + s.min; }, 0);
  }
  function durText(m) {
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return h + " h" + (r ? " " + r + " min" : "");
  }
  function priceText(list) {
    if (!list.length) return "—";
    var sum = list.reduce(function (a, s) { return a + s.price; }, 0);
    var from = list.some(function (s) { return s.from; });
    return (from ? "da " : "") + sum + " € (esempio)";
  }
  function needsTest(list) {
    return firstBox.checked && list.some(function (s) { return s.cat === "colore" && s.id !== "test" && s.id !== "tonalizzante"; });
  }
  function dayLabel(d) {
    return AF.dayNames[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
  }
  function sameDay(a, b) {
    return a && b && a.toDateString() === b.toDateString();
  }
  function showError(n, on) {
    var el = form.querySelector('[data-error="' + n + '"]');
    if (el) el.hidden = !on;
  }

  /* Passo 2: i prossimi 14 giorni */
  function renderDays() {
    var list = chosen();
    if (!list.length) {
      daysBox.innerHTML = '<p class="step__empty">Prima scegli un servizio.</p>';
      state.day = null;
      return;
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var minOffset = needsTest(list) ? 2 : 0;
    var row = document.createElement("div");
    row.className = "days__row";
    var keep = false;
    for (var i = 0; i < 14; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      var open = AF.schedule[d.getDay()];
      var testBlock = open && i < minOffset;
      var free = open && !testBlock && hasSlots(d, totalMin(list));
      var why = !open ? "chiuso" : testBlock ? "test 48 h" : i === 0 ? "finito" : "non entra";
      var whyLong = !open ? "chiuso" : testBlock ? "serve prima il test di sensibilità" : i === 0 ? "per oggi gli orari sono finiti" : "il servizio è troppo lungo per gli orari di questo giorno";
      var b = document.createElement("button");
      b.type = "button";
      b.className = "day";
      b.setAttribute("role", "radio");
      b.dataset.date = d.toISOString();
      b.setAttribute("aria-label", dayLabel(d) + (free ? "" : ", " + whyLong));
      b.innerHTML = '<span class="day__dow">' + (i === 0 ? "Oggi" : i === 1 ? "Domani" : DOW[d.getDay()]) + "</span>" +
        '<span class="day__num">' + d.getDate() + "</span>" +
        '<span class="' + (free ? "day__mon" : "day__closed") + '">' + (free ? MONTHS[d.getMonth()].slice(0, 3) : why) + "</span>";
      if (!free) b.disabled = true;
      var sel = free && sameDay(state.day, d);
      if (sel) keep = true;
      b.setAttribute("aria-checked", sel ? "true" : "false");
      row.appendChild(b);
    }
    daysBox.innerHTML = "";
    daysBox.appendChild(row);
    if (!keep) {
      state.day = null;
      state.time = null;
    }
  }

  /* Orari: ogni mezz'ora, il servizio deve finire prima della chiusura.
     Oggi si prenota almeno un'ora dopo l'ora attuale. */
  function slotsFor(d, minutes) {
    var open = AF.schedule[d.getDay()];
    if (!open) return [];
    var out = [];
    var now = new Date();
    var limit = sameDay(d, now) ? now.getHours() * 60 + now.getMinutes() + 60 : -1;
    for (var t = open[0]; t + minutes <= open[1]; t += 30) {
      if (t >= limit) out.push(t);
    }
    return out;
  }
  function hasSlots(d, minutes) {
    return slotsFor(d, minutes).length > 0;
  }

  function renderSlots() {
    var list = chosen();
    if (!state.day || !list.length) {
      slotsBox.innerHTML = '<p class="step__empty">Prima scegli il giorno.</p>';
      state.time = null;
      return;
    }
    var slots = slotsFor(state.day, totalMin(list));
    if (state.time !== null && slots.indexOf(state.time) < 0) state.time = null;
    var parts = [["Mattina", slots.filter(function (t) { return t < 780; })], ["Pomeriggio", slots.filter(function (t) { return t >= 780; })]];
    slotsBox.innerHTML = "";
    parts.forEach(function (p) {
      if (!p[1].length) return;
      var g = document.createElement("div");
      g.className = "slot-group reveal-in";
      g.innerHTML = '<p class="slot-group__title">' + p[0] + '</p><div class="slot-grid"></div>';
      p[1].forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "slot";
        b.setAttribute("role", "radio");
        b.dataset.time = t;
        b.textContent = AF.fmt(t);
        b.setAttribute("aria-checked", t === state.time ? "true" : "false");
        g.lastChild.appendChild(b);
      });
      slotsBox.appendChild(g);
    });
    var info = document.createElement("p");
    info.className = "step__hint";
    info.textContent = "Il servizio dura circa " + durText(totalMin(list)) + ": mostriamo solo gli orari in cui si finisce prima della chiusura.";
    slotsBox.appendChild(info);
  }

  function summary() {
    var list = chosen();
    var m = totalMin(list);
    form.querySelector('[data-sum="services"]').textContent = list.length ? list.map(function (s) { return s.name; }).join(", ") : "—";
    form.querySelector('[data-sum="day"]').textContent = state.day ? dayLabel(state.day) : "—";
    form.querySelector('[data-sum="time"]').textContent = state.time !== null ? AF.fmt(state.time) : "—";
    form.querySelector('[data-sum="dur"]').textContent = list.length ? "circa " + durText(m) : "—";
    form.querySelector('[data-sum="total"]').textContent = priceText(list);

    form.querySelector('[data-step="1"]').classList.toggle("is-done", list.length > 0);
    form.querySelector('[data-step="2"]').classList.toggle("is-done", !!state.day);
    form.querySelector('[data-step="3"]').classList.toggle("is-done", state.time !== null);
    testNote.hidden = !needsTest(list);

    if (!list.length) {
      barSum.textContent = "Nessun servizio scelto";
      barNext.textContent = "Scegli il servizio";
      barNext.dataset.go = "1";
    } else {
      barSum.textContent = list.length + (list.length === 1 ? " servizio" : " servizi") + " · " + durText(m) + " · " + priceText(list).replace(" (esempio)", "");
      if (!state.day) { barNext.textContent = "Scegli il giorno"; barNext.dataset.go = "2"; }
      else if (state.time === null) { barNext.textContent = "Scegli l'ora"; barNext.dataset.go = "3"; }
      else { barNext.textContent = "Ultimo passo"; barNext.dataset.go = "4"; }
    }
  }

  function refresh() {
    renderDays();
    renderSlots();
    summary();
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "servizio" || e.target === firstBox) {
      if (chosen().length) showError(1, false);
      refresh();
    }
  });

  daysBox.addEventListener("click", function (e) {
    var b = e.target.closest(".day");
    if (!b || b.disabled) return;
    state.day = new Date(b.dataset.date);
    daysBox.querySelectorAll(".day").forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
    showError(2, false);
    renderSlots();
    summary();
  });

  slotsBox.addEventListener("click", function (e) {
    var b = e.target.closest(".slot");
    if (!b) return;
    state.time = Number(b.dataset.time);
    slotsBox.querySelectorAll(".slot").forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
    showError(3, false);
    summary();
  });

  nameInput.addEventListener("input", function () {
    if (nameInput.value.trim().length >= 2) {
      nameInput.removeAttribute("aria-invalid");
      showError(4, false);
    }
  });

  function go(n) {
    var step = form.querySelector('[data-step="' + n + '"]');
    step.scrollIntoView({ behavior: AF.reduce ? "auto" : "smooth", block: "start" });
    if (n === "4") setTimeout(function () { nameInput.focus({ preventScroll: true }); }, AF.reduce ? 0 : 450);
  }
  barNext.addEventListener("click", function () { go(barNext.dataset.go || "1"); });

  /* Preselezione da ?servizio= */
  var pre = new URLSearchParams(location.search).get("servizio");
  if (pre && SERV[pre]) {
    var inp = form.querySelector('input[name="servizio"][value="' + pre + '"]');
    if (inp) inp.checked = true;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var list = chosen();
    var errors = [];
    showError(1, !list.length); if (!list.length) errors.push("1");
    showError(2, !state.day); if (!state.day) errors.push("2");
    showError(3, state.time === null); if (state.time === null) errors.push("3");
    var nameOk = nameInput.value.trim().length >= 2;
    showError(4, !nameOk);
    if (!nameOk) { nameInput.setAttribute("aria-invalid", "true"); errors.push("4"); }
    if (errors.length) {
      alertBox.textContent = errors.length === 1 ? "Manca un'informazione: la trovi segnata qui sopra." : "Mancano " + errors.length + " informazioni: le trovi segnate qui sopra.";
      if (errors[0] === "4") nameInput.focus(); else go(errors[0]);
      return;
    }
    alertBox.textContent = "";

    var lines = [
      "Ciao! Scrivo dalla demo di Atelier Filo (sito dimostrativo di Mockly).",
      "Vorrei prenotare:",
    ];
    list.forEach(function (s) { lines.push("- " + s.name); });
    lines.push("Giorno: " + dayLabel(state.day));
    lines.push("Ora: " + AF.fmt(state.time));
    lines.push("Durata: circa " + durText(totalMin(list)));
    lines.push("Totale indicativo: " + priceText(list));
    lines.push("Nome: " + nameInput.value.trim());
    if (firstBox.checked) lines.push("È la prima volta che vengo.");
    if (noteInput.value.trim()) lines.push("Note: " + noteInput.value.trim());
    var url = "https://wa.me/393517578080?text=" + encodeURIComponent(lines.join("\n"));

    sendBtn.setAttribute("aria-busy", "true");
    sendBtn.disabled = true;
    sendBtn.textContent = "Apro WhatsApp…";
    var win = window.open(url, "_blank");
    if (win) win.opener = null;
    setTimeout(function () {
      form.querySelectorAll(".step").forEach(function (s) { s.hidden = true; });
      done.querySelector("[data-wa-link]").href = url;
      done.hidden = false;
      bar.classList.add("is-hidden");
      done.focus();
      window.scrollTo({ top: done.getBoundingClientRect().top + window.scrollY - 90 });
      sendBtn.removeAttribute("aria-busy");
      sendBtn.disabled = false;
      sendBtn.textContent = "Invia la richiesta su WhatsApp";
      if (!win) done.querySelector("[data-wa-link]").textContent = "Apri WhatsApp con il messaggio";
    }, 500);
  });

  done.querySelector("[data-again]").addEventListener("click", function () {
    form.reset();
    state.day = null;
    state.time = null;
    form.querySelectorAll(".step").forEach(function (s) { s.hidden = false; });
    done.hidden = true;
    bar.classList.remove("is-hidden");
    refresh();
    window.scrollTo({ top: 0 });
  });

  refresh();
})();
