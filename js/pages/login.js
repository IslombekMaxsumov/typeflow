/* Log in / Sign up. Accounts only exist in this browser (see store.js).
   After logging in you go back to the page you came from (?next=). */
(function () {
  "use strict";
  const { t } = Core;
  const $ = (id) => document.getElementById(id);
  const loginForm = $("loginForm");
  const signupForm = $("signupForm");

  // Only go back to one of our own pages.
  const nextRaw = new URLSearchParams(location.search).get("next") || "";
  const next = /^[a-z]+\.html$/.test(nextRaw) && nextRaw !== "login.html" ? nextRaw : "profile.html";

  // A show/hide button for every password field.
  document.querySelectorAll("input[type=password]").forEach((input) => {
    const wrap = document.createElement("div");
    wrap.className = "pw-field";
    input.before(wrap);
    wrap.append(input);
    const btn = Site.el("button", { type: "button", class: "pw-toggle", "aria-controls": input.id });
    const label = () => {
      const shown = input.type === "text";
      btn.textContent = t(shown ? "auth.hide" : "auth.show");
      btn.setAttribute("aria-label", t(shown ? "auth.hidePassword" : "auth.showPassword"));
    };
    btn.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      label();
      input.focus();
    });
    wrap.append(btn);
    Core.onLang(label);
  });

  let mode = new URLSearchParams(location.search).get("tab") === "signup" ? "signup" : "login";
  function setMode(m, focus = true) {
    mode = m;
    $("tabLogin").setAttribute("aria-pressed", String(m === "login"));
    $("tabSignup").setAttribute("aria-pressed", String(m === "signup"));
    loginForm.hidden = m !== "login";
    signupForm.hidden = m !== "signup";
    Site.setTitle();
    $("authTitle").textContent = t(m === "login" ? "page.login" : "page.signup");
    if (focus) (m === "login" ? $("lUser") : $("sName")).focus();
  }
  $("tabLogin").addEventListener("click", () => setMode("login"));
  $("tabSignup").addEventListener("click", () => setMode("signup"));
  $("fillDemo").addEventListener("click", () => {
    setMode("login", false);
    $("lUser").value = Store.DEMO.username;
    $("lPass").value = Store.DEMO.password;
    loginForm.querySelector("[type=submit]").focus();
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = await Store.logIn($("lUser").value, $("lPass").value);
    $("loginError").textContent = err ? t(err) : "";
    $("loginError").classList.remove("is-info");
    [$("lUser"), $("lPass")].forEach((i) => i.setAttribute("aria-invalid", String(Boolean(err))));
    if (err) return $("lUser").focus();
    location.href = next;
  });

  // Sign up: check each field and show the error under it.
  const fields = {
    sName: () => ($("sName").value.trim().length >= 2 ? "" : "err.name"),
    sUser: () => {
      const v = $("sUser").value.trim().toLowerCase();
      if (!Store.USERNAME_RE.test(v)) return "err.username";
      if (Store.user(v)) return "err.taken";
      return "";
    },
    sPass: () => ($("sPass").value.length >= 6 ? "" : "err.password"),
    sPass2: () => ($("sPass2").value && $("sPass2").value === $("sPass").value ? "" : "err.password2"),
  };
  const touched = new Set();
  function check(id) {
    const key = fields[id]();
    $(id).setAttribute("aria-invalid", String(Boolean(key)));
    $(id + "-err").textContent = key ? t(key) : "";
    return key;
  }
  signupForm.addEventListener("focusout", (e) => {
    if (fields[e.target.id] && e.target.value) {
      touched.add(e.target.id);
      check(e.target.id);
    }
  });
  signupForm.addEventListener("input", (e) => touched.has(e.target.id) && check(e.target.id));
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bad = Object.keys(fields).filter((id) => {
      touched.add(id);
      return check(id);
    });
    if (bad.length) return $(bad[0]).focus();
    const err = await Store.signUp({ username: $("sUser").value, name: $("sName").value, password: $("sPass").value });
    if (err) {
      $("sUser-err").textContent = t(err);
      return $("sUser").focus();
    }
    Core.toast(t("auth.welcome"));
    location.href = next;
  });

  function render() {
    setMode(mode, false);
    touched.forEach(check);
    const err = $("loginError");
    const me = Store.current();
    if (err.classList.contains("is-info") && me) err.textContent = t("auth.already", { name: me.name });
    else if (err.textContent) err.textContent = t("err.wrongLogin");
  }

  Site.start(render, { title: () => t(mode === "login" ? "page.login" : "page.signup") }).then(() => {
    const me = Store.current();
    if (me) {
      $("loginError").textContent = t("auth.already", { name: me.name });
      $("loginError").classList.add("is-info"); // a note, not an error
    }
  });
})();
