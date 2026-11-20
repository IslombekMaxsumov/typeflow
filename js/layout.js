/* Parts shared by every page: header (menu, who is logged in, language,
   theme), footer, formatting, avatars, a confirm dialog and the page start-up.
   A page calls  Site.start(render)  and `render` runs again when the language
   or the account changes. Text from data always goes in with textContent. */
(function () {
  "use strict";
  const { t } = Core;
  const page = document.body.dataset.page;

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    children.flat(Infinity).forEach((c) => c !== null && c !== undefined && c !== false && node.append(c));
    return node;
  }
  function svgEl(tag, attrs, ...children) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([k, v]) => v !== null && v !== undefined && node.setAttribute(k, v));
    children.flat().forEach((c) => c && node.append(c));
    return node;
  }

  /* ---------- icons (Lucide, ISC licence; fixed strings) ---------- */
  const ICONS = {
    keyboard: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    restart: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
  };
  function icon(name, size = 20) {
    const s = svgEl("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: "icon icon-" + name });
    s.innerHTML = ICONS[name] || "";
    return s;
  }

  /* ---------- formatting ---------- */
  function num(n, decimals = 0) {
    const lang = Core.getLang();
    const [int, frac] = Number(n || 0).toFixed(decimals).split(".");
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : " ") + (frac ? (lang === "en" ? "." : ",") + frac : "");
  }
  const pct = (n) => num(n, n % 1 ? 1 : 0) + "%";
  // "1 h 05 min" / "12 min" / "45 s"
  function duration(seconds) {
    const s = Math.round(seconds);
    if (s < 60) return t("dur.s", { s });
    const m = Math.round(s / 60);
    const h = Math.floor(m / 60);
    return h ? t("dur.hm", { h, m: String(m % 60).padStart(2, "0") }) : t("dur.m", { m });
  }
  const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  // Uzbek month names are missing in some browsers, so Uzbek is done by hand.
  function date(value, { year = false, time = false } = {}) {
    const d = new Date(value);
    const hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    let s;
    if (Core.getLang() === "uz") s = d.getDate() + "-" + UZ_MONTHS[d.getMonth()] + (year ? ", " + d.getFullYear() : "");
    else s = Core.formatDate(d, year ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" });
    return time ? s + ", " + hm : s;
  }
  // "Time 30" / "Words 25" and the text language
  const modeLabel = (r) => t(r.mode === "time" ? "mode.timeN" : "mode.wordsN", { n: r.amount });
  const langLabel = (code) => t("tlang." + code);

  /* ---------- avatar: initials on the account colour ---------- */
  function avatar(user, size = "md") {
    const name = (user && user.name) || "?";
    const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    return el("span", { class: "avatar avatar-" + size, style: `--av:${(user && user.color) || "#5f6b7a"}`, "aria-hidden": "true", text: initials });
  }

  /* ---------- confirm dialog ---------- */
  function confirmBox({ title, text, ok, cancel = t("action.cancel"), danger = false }) {
    return new Promise((resolve) => {
      const back = document.activeElement;
      const dialog = el("dialog", { class: "confirm", "aria-labelledby": "confirmTitle" },
        el("h2", { id: "confirmTitle", text: title }),
        text && el("p", { text }),
        el("div", { class: "dialog-actions" },
          el("button", { type: "button", class: "btn btn-ghost", "data-v": "no", text: cancel }),
          el("button", { type: "button", class: "btn" + (danger ? " btn-danger" : ""), "data-v": "yes", text: ok })
        )
      );
      // The buttons close it themselves (the "close" event isn't reliable everywhere).
      const finish = (answer) => {
        dialog.close();
        dialog.remove();
        if (back && back.focus) back.focus();
        resolve(answer);
      };
      dialog.addEventListener("click", (e) => {
        const b = e.target.closest("[data-v]");
        if (b) finish(b.dataset.v === "yes");
      });
      dialog.addEventListener("cancel", (e) => {
        e.preventDefault();
        finish(false);
      });
      document.body.append(dialog);
      dialog.showModal();
      dialog.querySelector('[data-v="no"]').focus();
    });
  }

  /* ---------- compact option menus ----------
     Turns every  fieldset.opt-group  with radios into one short button that
     shows the chosen value ("30 s ⌄") and opens the radios as a small menu.
     The radios stay real form fields, so the page's own "change" handling
     keeps working. Returns refresh(): call it after the page sets the radios. */
  function picks(form) {
    const items = [...form.querySelectorAll("fieldset.opt-group")].filter((fs) => fs.querySelector("[type=radio]"));
    const all = items.map((fs, i) => {
      fs.id = fs.id || form.id + "-menu-" + i;
      const wrap = el("div", { class: "pick" });
      const value = el("span", { class: "pick-value" });
      const btn = el("button", { type: "button", class: "pick-btn", "aria-expanded": "false", "aria-controls": fs.id }, value, icon("chevronDown", 16));
      fs.classList.add("pick-menu");
      fs.hidden = true;
      fs.before(wrap);
      wrap.append(btn, fs);
      const open = (yes, focus = true) => {
        fs.hidden = !yes;
        btn.setAttribute("aria-expanded", String(yes));
        if (yes) {
          all.forEach((o) => o.wrap !== wrap && o.open(false, false));
          (fs.querySelector(":checked") || fs.querySelector("input")).focus();
        } else if (focus) btn.focus();
      };
      btn.addEventListener("click", () => open(fs.hidden));
      // A click picks and closes. With the keyboard, arrows move through the
      // choices (the menu stays open) and Enter, Space or Escape closes it.
      let pointer = false;
      fs.addEventListener("pointerdown", () => (pointer = true));
      fs.addEventListener("keydown", () => (pointer = false));
      fs.addEventListener("change", () => {
        refresh();
        if (pointer) setTimeout(() => open(false), 120); // a short moment to see the new choice
      });
      // Clicking the option that is already chosen closes the menu too.
      fs.addEventListener("pointerup", (e) => e.target.closest("label")?.querySelector("input:checked") && setTimeout(() => !fs.hidden && open(false), 120));
      wrap.addEventListener("keydown", (e) => {
        if (fs.hidden) return;
        if (e.key === "Escape" || ((e.key === "Enter" || e.key === " ") && e.target.matches("input"))) {
          e.preventDefault();
          e.stopPropagation();
          open(false);
        }
      });
      return { wrap, fs, btn, value, open };
    });
    function refresh() {
      all.forEach(({ fs, btn, value }) => {
        const label = fs.querySelector("input:checked")?.closest("label");
        value.textContent = label ? label.textContent.trim() : "";
        const legend = fs.querySelector("legend");
        btn.setAttribute("aria-label", (legend ? legend.textContent + ": " : "") + value.textContent);
      });
    }
    document.addEventListener("click", (e) => all.forEach((o) => !o.fs.hidden && !o.wrap.contains(e.target) && o.open(false, false)));
    refresh();
    return { refresh };
  }

  /* ---------- logo ----------
     Drawn inline from js/logo.js so it takes the theme colours. "full" is the
     symbol + wordmark, "mark" just the symbol (small phones, login page). */
  function logoSvg(kind) {
    const full = kind === "full";
    const stroke = { fill: "none", "stroke-width": 5, "stroke-linecap": "round" };
    return svgEl("svg", { viewBox: full ? "0 0 180 48" : "0 0 48 48", class: "logo-svg logo-" + kind, "aria-hidden": "true", focusable: "false" },
      svgEl("path", { d: LOGO.wave, class: "logo-wave", ...stroke }),
      svgEl("path", { d: LOGO.stem, class: "logo-stem", ...stroke }),
      full && svgEl("path", { d: LOGO.word, class: "logo-word" }));
  }
  function logo(cls) {
    return el("a", { class: cls, href: "index.html", "aria-label": "typeflow" }, logoSvg("full"), logoSvg("mark"));
  }

  /* ---------- colour theme menu ----------
     One button in the header opens: light / dark, then the colour themes.
     Swatch colours: [page, accent, text] for light and dark (from palettes). */
  const SWATCHES = {
    jade: { light: ["#f4f6f3", "#397a61", "#202923"], dark: ["#171d19", "#80b99a", "#e9f0ea"] },
    ocean: { light: ["#f2f5f8", "#2b6a99", "#1b2733"], dark: ["#0f1923", "#6cb0df", "#e5edf4"] },
    dusk: { light: ["#f5f3f8", "#6a4fb4", "#251f38"], dark: ["#17131f", "#b49df1", "#ece8f5"] },
    rose: { light: ["#f8f3f4", "#a9436a", "#33222a"], dark: ["#1d1317", "#f09ab6", "#f5e9ed"] },
    coral: { light: ["#f3f4f6", "#b84e36", "#1f2430"], dark: ["#15171c", "#f08b72", "#eceef2"] },
    mono: { light: ["#f4f4f4", "#1a1a1a", "#1a1a1a"], dark: ["#131313", "#ededed", "#ededed"] },
  };
  function themeMenu() {
    const btn = el("button", { type: "button", id: "themeBtn", class: "icon-btn", "aria-expanded": "false", "aria-controls": "themeMenu", "data-i18n-aria": "theme.menu" }, icon("palette", 18));
    const modeBtn = (mode) => el("button", { type: "button", class: "theme-mode", "data-mode": mode }, icon(mode === "light" ? "sun" : "moon", 16), el("span", { "data-i18n": "theme." + mode }));
    const menu = el("div", { id: "themeMenu", class: "theme-menu", hidden: true },
      el("p", { class: "theme-menu-title", "data-i18n": "theme.mode" }),
      el("div", { class: "theme-modes" }, modeBtn("light"), modeBtn("dark")),
      el("p", { class: "theme-menu-title", "data-i18n": "theme.colors" }),
      el("ul", { class: "theme-list" }, Core.PALETTES.map((name) =>
        el("li", null, el("button", { type: "button", class: "theme-opt", "data-palette-set": name },
          el("span", { class: "theme-swatch", "aria-hidden": "true" }, el("span")), el("span", { "data-i18n": "theme." + name }))))));
    const wrap = el("div", { class: "theme-pick" }, btn, menu);
    function refresh() {
      const mode = Core.currentTheme();
      const palette = Core.currentPalette();
      menu.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      menu.querySelectorAll("[data-palette-set]").forEach((b) => {
        const [bg, accent, ink] = SWATCHES[b.dataset.paletteSet][mode];
        b.setAttribute("aria-pressed", String(b.dataset.paletteSet === palette));
        b.firstChild.style.cssText = `--sw-bg:${bg};--sw-accent:${accent};--sw-ink:${ink}`;
      });
    }
    const open = (yes) => {
      menu.hidden = !yes;
      btn.setAttribute("aria-expanded", String(yes));
      if (yes) {
        refresh();
        menu.querySelector("[aria-pressed=true]").focus();
      }
    };
    btn.addEventListener("click", () => open(menu.hidden));
    menu.addEventListener("click", (e) => {
      const m = e.target.closest("[data-mode]");
      const p = e.target.closest("[data-palette-set]");
      if (m) Core.setTheme(m.dataset.mode);
      if (p) Core.setPalette(p.dataset.paletteSet);
      if (m || p) refresh();
    });
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) {
        e.stopPropagation();
        open(false);
        btn.focus();
      }
    });
    document.addEventListener("click", (e) => !menu.hidden && !wrap.contains(e.target) && open(false));
    return wrap;
  }

  /* ---------- header ---------- */
  const NAV = [["test", "index.html", "keyboard"], ["practice", "practice.html", "book"], ["leaderboard", "leaderboard.html", "trophy"], ["profile", "profile.html", "user"]];

  function renderHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
    const nav = el("nav", { class: "site-nav", "data-i18n-aria": "nav.label" },
      el("ul", null, NAV.map(([key, href, ic]) =>
        el("li", null, el("a", { href, "aria-current": page === key ? "page" : null }, icon(ic, 18), el("span", { "data-i18n": "page." + key })))
      ))
    );
    const langs = el("div", { class: "seg", role: "group", "data-i18n-aria": "lang.label" },
      ["uz", "ru", "en"].map((code) => el("button", { type: "button", "data-lang": code, lang: code, text: code.toUpperCase() })));
    const theme = themeMenu();
    host.append(el("div", { class: "container header-bar" },
      logo("brand"),
      nav,
      el("div", { class: "header-tools" }, el("div", { id: "userSlot", class: "user-slot" }), langs, theme)
    ));
    renderUser();
    document.body.classList.add("has-tabbar"); // phones: the menu becomes a bottom bar (site.css)
  }
  // Who is logged in (or a "Log in" link). Redrawn after log in / log out.
  function renderUser() {
    const slot = document.getElementById("userSlot");
    if (!slot) return;
    const me = Store.current();
    slot.replaceChildren(me
      ? el("a", { class: "user-chip", href: "profile.html", "aria-current": page === "profile" ? "page" : null }, avatar(me, "sm"), el("span", { class: "user-name", text: me.name }))
      : el("a", { class: "btn btn-small", href: "login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() || "index.html"), text: t("action.login"), "aria-current": page === "login" ? "page" : null })
    );
  }

  function renderFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    host.append(el("div", { class: "container footer-inner" },
      logo("footer-logo"),
      el("p", { "data-i18n": "footer.tagline" }),
      el("p", { "data-i18n": "footer.note" }),
      el("p", { class: "footer-copy", "data-i18n": "footer.copy" })
    ));
  }

  /* ---------- start ---------- */
  let titleFn = null;
  const setTitle = () => {
    const part = titleFn ? titleFn() : "";
    document.title = part ? part + " — " + t("brand") : t("meta.title");
  };

  async function start(render, options = {}) {
    await Store.ready; // the demo data is created on the very first visit
    titleFn = options.title || null;
    renderHeader();
    renderFooter();
    document.querySelectorAll("[data-logo]").forEach((slot) => slot.replaceChildren(logoSvg(slot.dataset.logo)));
    Core.onLang(() => {
      renderUser();
      render();
      setTitle();
    });
    Store.onChange(() => {
      renderUser();
      if (options.onChange) options.onChange();
      else render();
    });
    Core.init();
  }

  window.Site = { el, svgEl, icon, picks, num, pct, duration, date, modeLabel, langLabel, avatar, confirm: confirmBox, setTitle, start };
})();
