/* ==========================================================
   core.js — shared helpers for every site:
   - language switching (UZ / RU / EN) with data-i18n attributes
   - dark / light theme
   - safe localStorage wrapper
   - toast messages
   Set  window.APP_NS = "mysite"  before loading this file.
   Put translations in  window.I18N = { en: {...}, ru: {...}, uz: {...} }
   ========================================================== */
(function () {
  "use strict";

  var NS = window.APP_NS || "app";
  var LANGS = ["uz", "ru", "en"];
  var LOCALES = { en: "en-GB", ru: "ru-RU", uz: "uz-Latn-UZ" };

  /* ---------- storage (never throws) ---------- */
  var store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem(NS + ":" + key);
        return v === null ? fallback : v;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(NS + ":" + key, value); } catch (e) { /* private mode */ }
    },
    getJSON: function (key, fallback) {
      try {
        var v = localStorage.getItem(NS + ":" + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    setJSON: function (key, value) {
      try { localStorage.setItem(NS + ":" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- theme ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0c1226" : "#f3f6fb");
    refreshThemeButton();
  }

  function setTheme(theme) {
    store.set("theme", theme);
    applyTheme(theme);
  }

  function initialTheme() {
    var saved = store.get("theme", null);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }

  function refreshThemeButton() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    var label = t(currentTheme() === "dark" ? "theme.toLight" : "theme.toDark");
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }

  /* ---------- language ---------- */
  var lang = "en";
  var listeners = [];

  function dict(code) { return (window.I18N && window.I18N[code]) || {}; }

  function detectLang() {
    var saved = store.get("lang", null);
    if (LANGS.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) !== -1 ? nav : "en";
  }

  /* t("key", {name: "x"}) — falls back to English, then to the key itself.
     A value may be a plain string or a plural object {one, few, many, other}
     used together with vars.count. */
  function t(key, vars) {
    var val = dict(lang)[key];
    if (val === undefined) val = dict("en")[key];
    if (val === undefined) return key;
    if (typeof val === "object") {
      var rule = "other";
      try { rule = new Intl.PluralRules(LOCALES[lang]).select(Number(vars && vars.count)); } catch (e) { /* ignore */ }
      val = val[rule] || val.other || "";
    }
    return String(val).replace(/\{(\w+)\}/g, function (m, name) {
      return vars && vars[name] !== undefined ? vars[name] : m;
    });
  }

  function applyI18n(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
  }

  function setLang(code) {
    if (LANGS.indexOf(code) === -1) return;
    lang = code;
    store.set("lang", code);
    document.documentElement.setAttribute("lang", code);
    document.title = t("meta.title");
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.description"));
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === code));
    });
    applyI18n();
    refreshThemeButton();
    listeners.forEach(function (fn) { fn(code); });
  }

  function onLang(fn) { listeners.push(fn); }

  /* date helpers use the active language */
  function formatDate(date, options) {
    try {
      return new Intl.DateTimeFormat(LOCALES[lang], options).format(date);
    } catch (e) {
      return date.toLocaleDateString("en-GB", options);
    }
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(message, action) {
    var host = document.getElementById("toasts");
    if (!host) return;
    host.textContent = "";
    clearTimeout(toastTimer);

    var box = document.createElement("div");
    box.className = "toast";
    box.setAttribute("role", "status");
    var text = document.createElement("span");
    text.textContent = message;
    box.appendChild(text);

    if (action) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action.label;
      btn.addEventListener("click", function () {
        host.textContent = "";
        clearTimeout(toastTimer);
        action.onClick();
      });
      box.appendChild(btn);
    }
    host.appendChild(box);
    toastTimer = setTimeout(function () { host.textContent = ""; }, action ? 6000 : 2800);
  }

  /* ---------- init ---------- */
  function init() {
    applyTheme(initialTheme());

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        setTheme(currentTheme() === "dark" ? "light" : "dark");
      });
    }
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });

    // follow the system theme only until the visitor picks one
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var follow = function (e) {
        if (store.get("theme", null) === null) applyTheme(e.matches ? "dark" : "light");
      };
      if (mq.addEventListener) mq.addEventListener("change", follow);
    }

    setLang(detectLang());
  }

  window.Core = {
    store: store,
    t: t,
    setLang: setLang,
    getLang: function () { return lang; },
    onLang: onLang,
    applyI18n: applyI18n,
    formatDate: formatDate,
    toast: toast,
    init: init
  };
})();
