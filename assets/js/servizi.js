/* Atelier Filo — filtro del listino */
(function () {
  "use strict";

  var group = document.querySelector("[data-filters]");
  var list = document.querySelector("[data-list]");
  if (!group || !list) return;

  var rows = Array.prototype.slice.call(list.querySelectorAll(".svc"));
  var status = document.querySelector("[data-status]");
  var empty = document.querySelector("[data-empty]");
  var photos = document.querySelectorAll("[data-photo]");
  var LABEL = { tutti: "Tutto il listino", donna: "Donna", uomo: "Uomo", colore: "Colore" };

  ["tutti", "donna", "uomo", "colore"].forEach(function (k) {
    var n = k === "tutti" ? rows.length : rows.filter(function (r) { return r.dataset.cat === k; }).length;
    var el = group.querySelector('[data-count="' + k + '"]');
    if (el) el.textContent = n;
  });

  function apply(key, animate) {
    if (!LABEL[key]) key = "tutti";
    var shown = 0;
    group.querySelectorAll("[data-filter]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.filter === key ? "true" : "false");
    });
    rows.forEach(function (r) {
      var on = key === "tutti" || r.dataset.cat === key;
      r.hidden = !on;
      r.classList.remove("is-entering");
      if (on) {
        if (animate && !window.AF.reduce) {
          r.style.animationDelay = Math.min(shown, 8) * 35 + "ms";
          void r.offsetWidth;
          r.classList.add("is-entering");
        }
        shown++;
      }
    });
    empty.hidden = shown > 0;
    status.textContent = LABEL[key] + ": " + shown + (shown === 1 ? " servizio" : " servizi");
    var photo = key === "uomo" || key === "colore" ? key : "tutti";
    photos.forEach(function (p) { p.classList.toggle("is-shown", p.dataset.photo === photo); });
    var url = new URL(location.href);
    if (key === "tutti") url.searchParams.delete("filtro"); else url.searchParams.set("filtro", key);
    history.replaceState(null, "", url);
  }

  group.addEventListener("click", function (e) {
    var b = e.target.closest("[data-filter]");
    if (!b) return;
    apply(b.dataset.filter, true);
    var bar = document.querySelector(".list__bar");
    var top = bar.getBoundingClientRect().top + window.scrollY - 56;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: window.AF.reduce ? "auto" : "smooth" });
  });

  apply(new URLSearchParams(location.search).get("filtro") || "tutti", false);
})();
