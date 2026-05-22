(function () {
  "use strict";

  /* ── Helpers ─────────────────────────────────────────── */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced   = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ── Custom cursor ───────────────────────────────────── */
  function initCursor() {
    const root = $("[data-cursor-root]");
    if (!root || !fineHover) return;
    document.documentElement.classList.add("has-cursor");

    const dot  = root.querySelector(".cursor-dot");
    const ring = root.querySelector(".cursor-ring");
    let tx = 0, ty = 0, rx = 0, ry = 0, firstMove = false;

    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (!firstMove) {
        firstMove = true;
        rx = tx; ry = ty;
        if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        root.classList.add("is-ready");
      }
    }, { passive: true });

    (function tick() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      if (ring) ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
      requestAnimationFrame(tick);
    })();

    const HOVERABLES = "[data-cursor], .card, .btn, a[href], button, .project-row, .service-card, .contact-email";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(HOVERABLES)) root.classList.add("is-interactive");
    });
    document.addEventListener("mouseout", function (e) {
      var t = e.target.closest(HOVERABLES);
      if (t && !e.relatedTarget?.closest?.(HOVERABLES)) root.classList.remove("is-interactive");
    });
  }

  /* ── Nav ─────────────────────────────────────────────── */
  function initNav() {
    var nav     = $(".nav");
    var burger  = $(".nav-burger");
    var mobileMenu = $(".nav-mobile");
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle("is-scrolled", scrollY > 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger && mobileMenu) {
      burger.addEventListener("click", function () {
        var open = burger.getAttribute("aria-expanded") === "true";
        burger.setAttribute("aria-expanded", String(!open));
        mobileMenu.setAttribute("aria-hidden", String(open));
        document.body.style.overflow = open ? "" : "hidden";
      });

      // Close when a link is clicked
      $$(".nav-mobile-links a").forEach(function (a) {
        a.addEventListener("click", function () {
          burger.setAttribute("aria-expanded", "false");
          mobileMenu.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        });
      });

      // Close on Escape
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
          burger.setAttribute("aria-expanded", "false");
          mobileMenu.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
          burger.focus();
        }
      });
    }
  }

  /* ── Mouse-reactive gradient ─────────────────────────── */
  function initMouseGradient() {
    if (!fineHover) return;
    var heroGrad = $("[data-mouse-gradient]");
    if (!heroGrad) return;

    var mx = 30, my = 50, tx2 = 30, ty2 = 50;

    window.addEventListener("mousemove", function (e) {
      tx2 = (e.clientX / innerWidth)  * 100;
      ty2 = (e.clientY / innerHeight) * 100;
    }, { passive: true });

    (function gradFrame() {
      mx += (tx2 - mx) * 0.055;
      my += (ty2 - my) * 0.055;
      document.documentElement.style.setProperty("--mx", mx.toFixed(1) + "%");
      document.documentElement.style.setProperty("--my", my.toFixed(1) + "%");
      requestAnimationFrame(gradFrame);
    })();
  }

  /* ── Service card halo follows cursor ────────────────── */
  function initCardHalo() {
    if (!fineHover) return;
    $$(".service-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width  * 100).toFixed(1) + "%";
        var y = ((e.clientY - r.top)  / r.height * 100).toFixed(1) + "%";
        card.style.setProperty("--mx", x);
        card.style.setProperty("--my", y);
      });
    });
  }

  /* ── Tilt on service cards ───────────────────────────── */
  function initTilt() {
    if (!fineHover) return;
    $$("[data-tilt]").forEach(function (card) {
      var MAX = 6;
      var ttx = 0, tty = 0, ctx = 0, cty = 0, raf = null;
      card.classList.add("has-tilt");

      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        ttx = -py * MAX; tty = px * MAX;
        if (!raf) raf = requestAnimationFrame(tiltLoop);
      });
      card.addEventListener("mouseleave", function () {
        ttx = 0; tty = 0;
        if (!raf) raf = requestAnimationFrame(tiltLoop);
      });

      function tiltLoop() {
        ctx += (ttx - ctx) * 0.14;
        cty += (tty - cty) * 0.14;
        card.style.setProperty("--rx", ctx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cty.toFixed(2) + "deg");
        raf = (Math.abs(ttx - ctx) > 0.05 || Math.abs(tty - cty) > 0.05)
          ? requestAnimationFrame(tiltLoop) : null;
      }
    });
  }

  /* ── Scroll reveals ──────────────────────────────────── */
  function initReveals() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -3% 0px" });

    targets.forEach(function (el) { io.observe(el); });

    // ⚠️ Safety net: reveal anything still hidden after 6s
    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < innerHeight * 1.1) {
          el.classList.add("is-revealed");
        }
      });
    }, 6000);
  }

  /* ── Count-up on stats ───────────────────────────────── */
  function initCountUp() {
    var els = $$("[data-count-to]");
    if (!els.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var el      = entry.target;
        var target  = parseFloat(el.dataset.countTo);
        var decimals = (el.dataset.countTo.split(".")[1] || "").length;
        var duration = 1400;
        var start    = performance.now();

        function frame(now) {
          var progress = Math.min((now - start) / duration, 1);
          var eased    = 1 - Math.pow(1 - progress, 3);
          el.textContent = (eased * target).toFixed(decimals);
          if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── Marquee ─────────────────────────────────────────── */
  function initMarquee() {
    $$("[data-marquee]").forEach(function (track) {
      if (track.dataset.marqueeBound) return;
      track.dataset.marqueeBound = "1";

      var clone = track.cloneNode(true);
      clone.removeAttribute("data-marquee");
      clone.removeAttribute("data-marquee-bound");
      clone.setAttribute("aria-hidden", "true");
      track.parentNode.appendChild(clone);

      var distance = track.scrollWidth;
      var speed    = 55; // px/sec
      var duration = distance / speed;

      if (window.gsap) {
        gsap.to([track, clone], {
          x: -distance, duration: duration,
          ease: "none", repeat: -1,
          modifiers: { x: gsap.utils.unitize(function (x) { return parseFloat(x) % distance; }) }
        });
      } else {
        // CSS fallback
        var style = document.createElement("style");
        style.textContent =
          "@keyframes marqueeScroll{to{transform:translateX(-" + distance + "px)}}" +
          "[data-marquee],[data-marquee]+*{animation:marqueeScroll " + duration + "s linear infinite;}";
        document.head.appendChild(style);
      }
    });
  }

  /* ── Letter scramble on hover ────────────────────────── */
  function initScramble() {
    if (!fineHover) return;
    var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúñ@#&%·";

    $$("[data-scramble]").forEach(function (el) {
      var original  = el.textContent;
      var animating = false;

      el.addEventListener("mouseenter", function () {
        if (animating) return;
        animating = true;
        var chars  = original.split("");
        var delays = chars.map(function (_, i) { return 55 + i * 24 + Math.random() * 70; });
        var t0     = performance.now();

        function tick(now) {
          var elapsed = now - t0;
          el.textContent = chars.map(function (c, i) {
            if (c === " " || c === "@" || c === ".") return c;
            if (elapsed < delays[i]) return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            return c;
          }).join("");
          if (chars.some(function (c, i) { return c !== " " && elapsed < delays[i]; })) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = original;
            animating = false;
          }
        }
        requestAnimationFrame(tick);
      });
    });
  }

  /* ── Project row links ───────────────────────────────── */
  function initProjectLinks() {
    $$("[data-href]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        var a = document.createElement("a");
        a.href = el.dataset.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var a = document.createElement("a");
          a.href = el.dataset.href;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    });
  }

  /* ── Smooth anchor scroll ────────────────────────────── */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      window.scrollTo({
        top: target.getBoundingClientRect().top + scrollY - offset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ── Magnetic buttons ────────────────────────────────── */
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.dataset.magneticStrength || "0.28");
      var inner = document.createElement("span");
      inner.className = "magnetic-inner";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add("has-magnetic");

      var stx = 0, sty = 0, scx = 0, scy = 0, raf = null;

      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        stx = ((e.clientX - r.left) - r.width  / 2) * strength;
        sty = ((e.clientY - r.top)  - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", function () {
        stx = 0; sty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });

      function loop() {
        scx += (stx - scx) * 0.2;
        scy += (sty - scy) * 0.2;
        inner.style.transform = "translate3d(" + scx.toFixed(1) + "px," + scy.toFixed(1) + "px,0)";
        raf = (Math.abs(stx - scx) > 0.1 || Math.abs(sty - scy) > 0.1)
          ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ── GSAP ScrollTrigger (parallax hero) ──────────────── */
  function initHeroParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    var heroBg = $(".hero-gradient");
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 20, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    var heroContent = $(".hero-text");
    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: -15, opacity: 0.2, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "20% top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ── Boot ────────────────────────────────────────────── */
  function boot() {
    safe(initCursor,        "initCursor");
    safe(initNav,           "initNav");
    safe(initMouseGradient, "initMouseGradient");
    safe(initCardHalo,      "initCardHalo");
    safe(initReveals,       "initReveals");
    safe(initCountUp,       "initCountUp");
    safe(initMarquee,       "initMarquee");
    safe(initScramble,      "initScramble");
    safe(initProjectLinks,  "initProjectLinks");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initMagnetic,      "initMagnetic");
    safe(initTilt,          "initTilt");

    if (window.gsap && window.ScrollTrigger) {
      safe(initHeroParallax, "initHeroParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
