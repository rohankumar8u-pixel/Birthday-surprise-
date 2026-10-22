(function () {
  "use strict";

  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;
  var intro = document.getElementById("intro");
  var openBtn = document.getElementById("openBtn");
  var musicBtn = document.getElementById("music");
  var song = document.getElementById("song");
  var track = document.getElementById("track");
  var stage = document.getElementById("stage");
  var hint = document.getElementById("hint");
  var finale = document.getElementById("finale");
  var scenes = Array.prototype.slice.call(stage.children);
  var N = scenes.length;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  /* ---------- floating hearts + sparkles ---------- */
  (function buildFx() {
    var fx = document.getElementById("fx");
    var frag = document.createDocumentFragment();
    var i, el;
    var hearts = window.innerWidth < 700 ? 11 : 18;
    for (i = 0; i < hearts; i++) {
      el = document.createElement("i");
      el.textContent = "\u2665";
      el.style.setProperty("--x", Math.round(Math.random() * 100) + "%");
      el.style.setProperty("--s", (12 + Math.random() * 20).toFixed(0) + "px");
      el.style.setProperty("--d", (13 + Math.random() * 14).toFixed(1) + "s");
      el.style.setProperty("--w", (-Math.random() * 20).toFixed(1) + "s");
      el.style.setProperty("--dx", (Math.random() * 60 - 30).toFixed(0) + "px");
      frag.appendChild(el);
    }
    for (i = 0; i < 16; i++) {
      el = document.createElement("b");
      el.style.setProperty("--x", Math.round(Math.random() * 96) + "%");
      el.style.setProperty("--y", Math.round(Math.random() * 96) + "%");
      el.style.setProperty("--s", (6 + Math.random() * 12).toFixed(0) + "px");
      el.style.setProperty("--d", (3 + Math.random() * 4).toFixed(1) + "s");
      el.style.setProperty("--w", (-Math.random() * 6).toFixed(1) + "s");
      frag.appendChild(el);
    }
    fx.appendChild(frag);
  })();

  /* ---------- music ---------- */
  var fadeTimer = null;
  function fadeIn() {
    clearInterval(fadeTimer);
    song.volume = 0;
    var v = 0;
    fadeTimer = setInterval(function () {
      v += 0.04;
      if (v >= 0.8) { v = 0.8; clearInterval(fadeTimer); }
      try { song.volume = v; } catch (e) { clearInterval(fadeTimer); }
    }, 120);
  }
  function syncMusicUi() {
    var on = !song.paused;
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  }
  song.addEventListener("play", syncMusicUi);
  song.addEventListener("pause", syncMusicUi);
  musicBtn.addEventListener("click", function () {
    if (song.paused) {
      var p = song.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      song.pause();
    }
  });

  /* ---------- opening ---------- */
  var heroIn = rm ? 1 : 0;
  var opened = false;
  openBtn.addEventListener("click", function () {
    if (opened) return;
    opened = true;
    var p = song.play(); /* must run inside the click for browser audio rules */
    if (p && p.catch) p.catch(function () {});
    fadeIn();
    musicBtn.hidden = false;
    intro.classList.add("gone");
    body.classList.remove("locked");
    window.scrollTo(0, 0);
    syncMusicUi();
    if (rm) { heroIn = 1; dirty = true; return; }
    var t0 = performance.now();
    (function tick(now) {
      heroIn = Math.min(1, (now - t0 - 500) / 2600);
      if (heroIn < 0) heroIn = 0;
      dirty = true;
      if (heroIn < 1) requestAnimationFrame(tick);
    })(t0);
  });

  /* ---------- scroll story ---------- */
  var parts = scenes.map(function (s) {
    return {
      el: s,
      bg: s.querySelector(".bg, .cover"),
      lines: Array.prototype.slice.call(s.querySelectorAll("[data-r]"))
    };
  });

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(v) { v = clamp(v); return v * v * (3 - 2 * v); }

  var dirty = true;
  function render() {
    var range = Math.max(1, track.offsetHeight - window.innerHeight);
    var t = clamp(window.scrollY / range) * (N - 1);
    var a = Math.min(Math.floor(t), N - 2);
    var frac = t - a;
    var ue = a + smooth((frac - 0.38) / 0.62);
    if (t >= N - 1) ue = N - 1;

    for (var i = 0; i < N; i++) {
      var P = parts[i], s = P.el;
      var e = i === 0 ? heroIn : clamp(ue - (i - 1));
      var l = clamp(ue - i);
      var slide = i === 0 ? 0 : 1 - clamp(ue - (i - 1));
      if ((i > 0 && slide >= 1) || l >= 1) { s.style.visibility = "hidden"; continue; }
      s.style.visibility = "visible";

      if (rm) {
        s.style.transform = "none";
        s.style.opacity = i === 0 ? 1 : slide < 1 ? 1 - slide : 1;
      } else {
        var ty = slide * 100 - l * 20;
        s.style.transform = "translate3d(0," + ty.toFixed(2) + "%,0)";
        s.style.opacity = (1 - l * 0.55).toFixed(3);
        if (P.bg) {
          var by = -slide * 14 + l * 6;
          var sc = 1.02 + 0.05 * (1 - slide) + 0.03 * l;
          P.bg.style.transform = "translate3d(0," + by.toFixed(2) + "%,0) scale(" + sc.toFixed(3) + ")";
        }
      }

      for (var j = 0; j < P.lines.length; j++) {
        var r = clamp((e - 0.5 - 0.07 * j) / 0.3);
        var out = clamp(l * 2.2);
        var o = r * (1 - out);
        P.lines[j].style.opacity = o.toFixed(3);
        P.lines[j].style.translate = rm ? "none" : "0 " + ((1 - r) * 26 - out * 16).toFixed(1) + "px";
      }
    }

    hint.style.opacity = clamp(1 - t * 5) * (heroIn > 0.9 ? 1 : 0);
    var fe = clamp(ue - (N - 2));
    if (fe > 0.7) finale.classList.add("on");
    else if (fe < 0.15) finale.classList.remove("on");
    dirty = false;
  }

  function loop() {
    if (dirty) render();
    requestAnimationFrame(loop);
  }
  window.addEventListener("scroll", function () { dirty = true; }, { passive: true });
  window.addEventListener("resize", function () { dirty = true; });
  render();
  requestAnimationFrame(loop);
})();
