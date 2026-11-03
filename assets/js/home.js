/* Atelier Filo — solo copertina */
(function () {
  "use strict";

  /* La testata mostra il nome solo quando la copertina è passata:
     così sullo schermo il nome compare una volta sola. */
  var mast = document.querySelector("[data-mast]");
  var title = document.querySelector(".cover__mast");
  if (mast && title && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      mast.classList.toggle("mast--cover", entries[0].isIntersecting);
    }, { rootMargin: "-56px 0px 0px 0px" }).observe(title);
  } else if (mast) {
    mast.classList.remove("mast--cover");
  }

  /* Cartella colori */
  var TONES = {
    cioccolato: {
      name: "Castano cioccolato",
      base: "Da castano chiaro a castano scuro",
      how: "Colore completo, riflesso caldo e lucido",
      last: "Ricrescita da ritoccare ogni 4–6 settimane",
      id: "colore"
    },
    rame: {
      name: "Rame",
      base: "Castano chiaro o biondo scuro",
      how: "Colore con pigmento rame, poi tonalizzante",
      last: "Il rame scarica prima degli altri: tonalizzante ogni 3–4 settimane",
      id: "tonalizzante"
    },
    miele: {
      name: "Biondo miele",
      base: "Castano chiaro o biondo scuro",
      how: "Balayage a mano libera, poi tonalizzante caldo",
      last: "Si sfuma da solo: ritocco ogni 3–4 mesi",
      id: "balayage"
    },
    cenere: {
      name: "Biondo cenere",
      base: "Biondo, oppure capello già schiarito",
      how: "Schiariture con stagnole, poi tonalizzante freddo",
      last: "Il giallo torna con i lavaggi: shampoo viola una volta a settimana",
      id: "meches"
    },
    corvino: {
      name: "Nero blu",
      base: "Qualsiasi base, anche con capelli bianchi",
      how: "Colore completo con riflesso blu freddo",
      last: "Copre bene il bianco; per tornare chiari serve una decolorazione",
      id: "colore"
    }
  };

  var fan = document.querySelector("[data-fan]");
  var card = document.querySelector("[data-fan-card]");
  if (!fan || !card) return;

  function show(key) {
    var t = TONES[key];
    if (!t) return;
    fan.querySelectorAll(".fan__strand").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-tone") === key ? "true" : "false");
    });
    card.innerHTML =
      '<p class="fan__name">' + t.name + "</p>" +
      '<dl class="fan__meta">' +
      "<div><dt>Su che base</dt><dd>" + t.base + "</dd></div>" +
      "<div><dt>Come si fa</dt><dd>" + t.how + "</dd></div>" +
      "<div><dt>Quanto dura</dt><dd>" + t.last + "</dd></div>" +
      "</dl>" +
      '<a class="text-link" href="prenota.html?servizio=' + t.id + '">Prenota questo colore</a>';
    card.classList.remove("is-changing");
    void card.offsetWidth;
    card.classList.add("is-changing");
  }

  fan.addEventListener("click", function (e) {
    var b = e.target.closest(".fan__strand");
    if (b) show(b.getAttribute("data-tone"));
  });
  fan.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var list = Array.prototype.slice.call(fan.querySelectorAll(".fan__strand"));
    var i = list.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var n = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
    n.focus();
    show(n.getAttribute("data-tone"));
  });
})();
