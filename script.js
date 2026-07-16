(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Navbar */
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  const closeMenu = () => {
    if (!hamburger || !navLinks) return;
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const open = hamburger.classList.toggle("open");
      navLinks.classList.toggle("open", open);
      hamburger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });

    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (navLinks.contains(t) || hamburger.contains(t)) return;
      closeMenu();
    });
  }

  /* Fast, predictable anchor scrolling on desktop and mobile */
  let scrollAnimation = 0;
  const cancelScroll = () => {
    if (scrollAnimation) cancelAnimationFrame(scrollAnimation);
    scrollAnimation = 0;
  };

  const smoothScrollTo = (target) => {
    cancelScroll();
    const navHeight = navbar?.getBoundingClientRect().height || 0;
    const start = window.scrollY;
    const destination = Math.max(
      0,
      target.getBoundingClientRect().top + start - navHeight - 14
    );
    const distance = destination - start;

    if (reduced || Math.abs(distance) < 4) {
      window.scrollTo(0, destination);
      return;
    }

    const duration = window.innerWidth <= 768 ? 320 : 420;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start + distance * eased);
      if (progress < 1) scrollAnimation = requestAnimationFrame(tick);
      else scrollAnimation = 0;
    };
    scrollAnimation = requestAnimationFrame(tick);
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    smoothScrollTo(target);
    history.replaceState(null, "", id);
  });

  window.addEventListener("wheel", cancelScroll, { passive: true });
  window.addEventListener("touchstart", cancelScroll, { passive: true });

  /* Active nav — only for linked sections */
  const sections = [...document.querySelectorAll("section[id]")];
  const linkMap = new Map(
    [...document.querySelectorAll(".nav-links a")]
      .filter((a) => !a.classList.contains("nav-mobile-cta"))
      .map((a) => [a.getAttribute("href")?.slice(1), a])
  );

  if ("IntersectionObserver" in window) {
    const navObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          if (!linkMap.has(id)) return;
          linkMap.forEach((link, key) => {
            link.classList.toggle("active", key === id);
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => navObs.observe(s));
  }

  /* Reveal */
  const reveals = document.querySelectorAll(".reveal");

  const revealInView = () => {
    const h = window.innerHeight;
    reveals.forEach((el) => {
      if (el.classList.contains("visible")) return;
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.96 && r.bottom > h * 0.02) {
        el.classList.add("visible");
      }
    });
  };

  if (reduced) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else if ("IntersectionObserver" in window) {
    const revObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "60px 0px 60px 0px" }
    );
    reveals.forEach((el) => revObs.observe(el));
    revealInView();
    window.addEventListener("resize", revealInView, { passive: true });
    window.addEventListener("scroll", revealInView, { passive: true });
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  /* Counters */
  const animateCount = (el, target, suffix) => {
    const numEl = el.querySelector(".counter-num");
    if (!numEl) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      numEl.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else numEl.textContent = target + suffix;
    };
    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll(".counter-item");
  if ("IntersectionObserver" in window) {
    const cObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.dataset.static) {
            const numEl = el.querySelector(".counter-num");
            if (numEl) numEl.textContent = el.dataset.static;
          } else {
            const target = Number(el.dataset.target || 0);
            const suffix = el.dataset.suffix || "";
            if (!reduced) animateCount(el, target, suffix);
            else {
              const numEl = el.querySelector(".counter-num");
              if (numEl) numEl.textContent = target + suffix;
            }
          }
          obs.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => cObs.observe(c));
  }

  /* FAQ */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-q");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* Project tabs */
  document.querySelectorAll(".project-card").forEach((card) => {
    const tabs = card.querySelectorAll(".tab-btn");
    const panels = card.querySelectorAll(".tab-panel");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const key = tab.dataset.tab;
        tabs.forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        panels.forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        const panel = card.querySelector(`.tab-panel[data-panel="${key}"]`);
        if (panel) panel.classList.add("active");
      });
    });
  });

  /* Contact form — FormSubmit AJAX → Gmail */
  const form = document.getElementById("contactForm");
  if (form) {
    const statusEl = document.getElementById("formStatus");
    const subjectHidden = document.getElementById("formSubject");
    const btn = document.getElementById("contactSubmit");
    const endpoint = form.getAttribute("action");

    const showStatus = (text, type) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = text;
      statusEl.className = `form-status form-status--${type}`;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const subject = String(data.get("subject") || "").trim();
      const message = String(data.get("message") || "").trim();

      if (!name || !email || !subject || !message) {
        showStatus("Please fill in all fields.", "error");
        return;
      }

      if (subjectHidden) {
        subjectHidden.value = `Portfolio contact: ${subject}`;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending…";
      }
      showStatus("Sending your message…", "pending");

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });

        const payload = await res.json().catch(() => ({}));

        if (res.ok) {
          form.reset();
          if (subjectHidden) {
            subjectHidden.value = "New message from CodeWithRupanjali portfolio";
          }
          showStatus(
            "Message sent successfully. Check Gmail (and Spam/Promotions). If this is the first send, open FormSubmit’s email and click Activate Form.",
            "success"
          );
        } else {
          const errMsg =
            payload.message ||
            "Could not send right now. Please email rupanjalikumari264@gmail.com directly.";
          showStatus(errMsg, "error");
        }
      } catch (err) {
        showStatus(
          "Network error. Please try again or email rupanjalikumari264@gmail.com.",
          "error"
        );
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Send Message";
        }
      }
    });
  }

  /* Scroll chrome — single passive handler */
  const progress = document.querySelector("#scrollProgress span");
  const backTop = document.getElementById("backTop");
  let chromeFrame = 0;
  const updateChrome = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.transform = `scaleX(${ratio / 100})`;
    if (backTop) backTop.classList.toggle("show", window.scrollY > 480);
    if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 20);
  };
  const requestChromeUpdate = () => {
    if (chromeFrame) return;
    chromeFrame = requestAnimationFrame(() => {
      chromeFrame = 0;
      updateChrome();
    });
  };
  updateChrome();
  window.addEventListener("scroll", requestChromeUpdate, { passive: true });
  if (backTop) {
    backTop.addEventListener("click", () => {
      const home = document.getElementById("home");
      if (home) smoothScrollTo(home);
      else window.scrollTo(0, 0);
    });
  }

  /* Soft ambient parallax only — portrait stays stable */
  const orbs = document.querySelectorAll(".hero-ambient .orb");
  if (!reduced && window.matchMedia("(pointer:fine)").matches) {
    window.addEventListener(
      "pointermove",
      (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        orbs.forEach((orb, i) => {
          const strength = (i + 1) * 3;
          orb.style.translate = `${nx * strength}px ${ny * strength}px`;
        });
      },
      { passive: true }
    );
  }

  /* Hero role rotation — one role at a time */
  const typedEl = document.getElementById("typedRole");
  const roles = [
    "SOFTWARE DEVELOPER",
    "AI ENTHUSIAST",
    "PROGRAMMER",
    "FULL-STACK & UI",
  ];
  if (typedEl) {
    if (reduced) {
      typedEl.textContent = roles[0];
    } else {
      let roleIndex = 0;
      let fadeTimeout;
      let swapTimeout;
      let rotationInterval;
      const visibleMs = 2500;
      const fadeMs = 350;

      typedEl.textContent = roles[0];
      typedEl.style.opacity = "1";

      const showNextRole = () => {
        fadeTimeout = window.setTimeout(() => {
          typedEl.style.opacity = "0";
          swapTimeout = window.setTimeout(() => {
            roleIndex = (roleIndex + 1) % roles.length;
            typedEl.textContent = roles[roleIndex];
            typedEl.style.opacity = "1";
          }, fadeMs);
        }, visibleMs - fadeMs);
      };

      showNextRole();
      rotationInterval = window.setInterval(showNextRole, visibleMs);

      window.addEventListener("beforeunload", () => {
        window.clearInterval(rotationInterval);
        window.clearTimeout(fadeTimeout);
        window.clearTimeout(swapTimeout);
      });
    }
  }

  /* Lightweight button feedback */
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (reduced) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 380);
    });
  });
})();
