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
    const theme = el("button", { type: "button", id: "themeToggle", class: "icon-btn" }, icon("sun", 18), icon("moon", 18));
    host.append(el("div", { class: "container header-bar" },
      el("a", { class: "brand", href: "index.html", "data-i18n": "brand" }),
      nav,
      el("div", { class: "header-tools" }, el("div", { id: "userSlot", class: "user-slot" }), langs, theme)
    ));
    renderUser();
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

  window.Site = { el, svgEl, icon, num, pct, duration, date, modeLabel, langLabel, avatar, confirm: confirmBox, setTitle, start };
})();
