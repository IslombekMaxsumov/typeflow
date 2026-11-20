/* Accounts, results and stats. Everything lives in localStorage (Core.store):
   there is no server, so accounts are demo accounts that only exist in this
   browser. Passwords are never stored as typed: we keep a random salt and a
   SHA-256 hash of salt + password (still not real security without a server,
   but nobody can read the password back).

   users:   { [username]: { username, name, color, salt, hash, created, demo } }
   session: the logged-in username ("" = guest)
   results: [{ id, user, mode: "time"|"words", amount, lang, textType, punct, nums,
               wpm, raw, acc, consistency, chars: {correct, wrong, extra, missed},
               seconds, date (ISO), series: [wpm each second] }]
   lessons: { [username or "guest"]: { [lessonId]: { best, passed } } } */
(function () {
  "use strict";
  const { store } = Core;
  const COLORS = ["#2f6fdf", "#d64545", "#1f9d74", "#c27c0e", "#8a4fd6", "#d0517f", "#21808f", "#5f6b7a"];
  const DEMO = { username: "demo", password: "demo123", name: "Demo" };

  /* ---------- small helpers ---------- */
  const emit = () => window.dispatchEvent(new Event("store:change"));
  const users = () => store.getJSON("users", {}) || {};
  const saveUsers = (u) => store.setJSON("users", u);
  const results = () => {
    const r = store.getJSON("results", []);
    return Array.isArray(r) ? r.filter((x) => x && Number.isFinite(x.wpm)) : [];
  };
  const saveResults = (r) => store.setJSON("results", r);
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const randomSalt = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");

  /* ---------- accounts ---------- */
  const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
  function current() {
    const name = store.get("session", "");
    return (name && users()[name]) || null;
  }
  // Returns "" on success, or an error key.
  async function signUp({ username, name, password }) {
    username = String(username || "").trim().toLowerCase();
    if (!USERNAME_RE.test(username)) return "err.username";
    if (users()[username]) return "err.taken";
    if (String(name || "").trim().length < 2) return "err.name";
    if (String(password || "").length < 6) return "err.password";
    const salt = randomSalt();
    const all = users();
    all[username] = {
      username, name: String(name).trim().slice(0, 30), color: COLORS[Object.keys(all).length % COLORS.length],
      salt, hash: await sha256(salt + password), created: new Date().toISOString(), demo: false,
    };
    saveUsers(all);
    store.set("session", username);
    emit();
    return "";
  }
  async function logIn(username, password) {
    username = String(username || "").trim().toLowerCase();
    const u = users()[username];
    if (!u || u.npc) return "err.wrongLogin";
    if ((await sha256(u.salt + password)) !== u.hash) return "err.wrongLogin";
    store.set("session", username);
    emit();
    return "";
  }
  function logOut() {
    store.set("session", "");
    emit();
  }
  function updateProfile(patch) {
    const me = current();
    if (!me) return;
    const all = users();
    if (patch.name !== undefined) all[me.username].name = String(patch.name).trim().slice(0, 30) || me.name;
    if (patch.color && COLORS.includes(patch.color)) all[me.username].color = patch.color;
    saveUsers(all);
    emit();
  }
  // Deletes the account and all its results and lesson progress.
  function deleteAccount() {
    const me = current();
    if (!me) return;
    const all = users();
    delete all[me.username];
    saveUsers(all);
    saveResults(results().filter((r) => r.user !== me.username));
    const lessons = store.getJSON("lessons", {}) || {};
    delete lessons[me.username];
    store.setJSON("lessons", lessons);
    store.set("session", "");
    emit();
  }

  /* ---------- results ---------- */
  function addResult(r) {
    const me = current();
    const result = { ...r, id: newId(), user: me ? me.username : "", date: new Date().toISOString() };
    const before = personalBest(result.user, result.mode, result.amount, result.lang);
    saveResults([...results(), result]);
    emit();
    return { result, isBest: !before || result.wpm > before.wpm, previous: before };
  }
  const resultsOf = (username) => results().filter((r) => r.user === username).sort((a, b) => b.date.localeCompare(a.date));
  function personalBest(username, mode, amount, lang) {
    return resultsOf(username).filter((r) => r.mode === mode && r.amount === amount && (!lang || r.lang === lang))
      .sort((a, b) => b.wpm - a.wpm || b.acc - a.acc)[0] || null;
  }

  // Best result per player for a mode/language/period, highest WPM first.
  // Guest results ("") never show on the leaderboard.
  function leaderboard({ amount = 30, lang = "en", period = "all" } = {}) {
    const now = Date.now();
    const since = period === "today" ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      : period === "week" ? now - 7 * 864e5 : 0;
    const all = users();
    const best = new Map();
    results().forEach((r) => {
      if (!r.user || !all[r.user] || r.mode !== "time" || r.amount !== amount || r.lang !== lang) return;
      if (new Date(r.date).getTime() < since) return;
      const cur = best.get(r.user);
      if (!cur || r.wpm > cur.wpm || (r.wpm === cur.wpm && r.acc > cur.acc)) best.set(r.user, r);
    });
    return [...best.values()].sort((a, b) => b.wpm - a.wpm || b.acc - a.acc).map((r, i) => ({ rank: i + 1, result: r, user: all[r.user] }));
  }

  /* ---------- lesson progress ---------- */
  function lessonProgress() {
    const me = current();
    const all = store.getJSON("lessons", {}) || {};
    return all[me ? me.username : "guest"] || {};
  }
  function saveLesson(id, acc, passed) {
    const me = current();
    const key = me ? me.username : "guest";
    const all = store.getJSON("lessons", {}) || {};
    const mine = all[key] || {};
    const prev = mine[id] || { best: 0, passed: false };
    mine[id] = { best: Math.max(prev.best, acc), passed: prev.passed || passed };
    all[key] = mine;
    store.setJSON("lessons", all);
    emit();
  }

  /* ---------- demo data ----------
     A demo account (demo / demo123) with 10 weeks of history, and some demo
     players for the leaderboard (they can't be logged into). */
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const NPCS = [
    ["aziza_k", "Aziza K."], ["timur_r", "Timur R."], ["dilnoza", "Dilnoza S."], ["sardor_m", "Sardor M."],
    ["elena_v", "Elena V."], ["bekzod", "Bekzod T."], ["madina_a", "Madina A."], ["jasur_n", "Jasur N."],
    ["olga_p", "Olga P."], ["rustam_y", "Rustam Y."], ["nilufar", "Nilufar B."], ["alex_w", "Alex W."],
  ];
  function fakeResult(rand, user, skill, daysAgo, mode = "time", amount = 30, lang = "en") {
    const wpm = Math.max(18, Math.round(skill + (rand() - 0.5) * 14));
    const acc = Math.min(100, Math.round((92 + rand() * 7.5) * 10) / 10);
    const seconds = mode === "time" ? amount : Math.round((amount / wpm) * 60);
    const series = Array.from({ length: Math.max(2, Math.min(seconds, 60)) }, () => Math.max(5, Math.round(wpm + (rand() - 0.5) * 18)));
    const correct = Math.round((wpm * 5 * seconds) / 60);
    const d = new Date(Date.now() - daysAgo * 864e5 - rand() * 864e5 * 0.8);
    return {
      id: newId() + Math.floor(rand() * 1e6), user, mode, amount, lang, textType: "words", punct: false, nums: false,
      wpm, raw: wpm + Math.round(rand() * 6), acc, consistency: Math.round(65 + rand() * 25),
      chars: { correct, wrong: Math.round(correct * (1 - acc / 100)), extra: Math.round(rand() * 3), missed: Math.round(rand() * 2) },
      seconds, date: d.toISOString(), series,
    };
  }

  async function seed() {
    if (store.get("seeded", "")) return;
    const rand = rng(20261120);
    const all = users();
    const out = results();
    // demo account: 10 weeks, getting faster
    const salt = randomSalt();
    all.demo = { username: "demo", name: DEMO.name, color: COLORS[0], salt, hash: await sha256(salt + DEMO.password), created: new Date(Date.now() - 72 * 864e5).toISOString(), demo: true };
    for (let day = 70; day >= 1; day--) {
      if (rand() < 0.45) continue;
      const n = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        const skill = 42 + (70 - day) * 0.32;
        const pick = rand();
        const [mode, amount] = pick < 0.5 ? ["time", 30] : pick < 0.75 ? ["time", 15] : pick < 0.9 ? ["time", 60] : ["words", 25];
        const lang = rand() < 0.55 ? "en" : rand() < 0.6 ? "uz" : "ru";
        out.push(fakeResult(rand, "demo", skill - (lang === "en" ? 0 : 6), day, mode, amount, lang));
      }
    }
    // demo players: a few results each in the main modes and languages
    NPCS.forEach(([username, name], i) => {
      all[username] = { username, name, color: COLORS[(i + 1) % COLORS.length], salt: "", hash: "", created: new Date(Date.now() - 90 * 864e5).toISOString(), demo: true, npc: true };
      const skill = 38 + rand() * 55;
      for (let k = 0; k < 9; k++) {
        const amount = [15, 30, 60][k % 3];
        const lang = ["en", "uz", "ru"][Math.floor(k / 3)];
        out.push(fakeResult(rand, username, skill + (amount === 15 ? 4 : amount === 60 ? -3 : 0) - (lang === "en" ? 0 : 5), Math.floor(rand() * 20), "time", amount, lang));
      }
    });
    saveUsers(all);
    saveResults(out);
    store.set("seeded", "1");
  }

  // Pages wait for this before drawing (the demo password hash is async).
  const ready = seed();

  window.Store = {
    ready, COLORS, DEMO, USERNAME_RE,
    current, signUp, logIn, logOut, updateProfile, deleteAccount,
    addResult, results, resultsOf, personalBest, leaderboard,
    lessonProgress, saveLesson, user: (name) => users()[name] || null,
    onChange: (fn) => {
      window.addEventListener("store:change", fn);
      window.addEventListener("storage", (e) => e.key && e.key.startsWith(window.APP_NS + ":") && !/:(lang|theme)$/.test(e.key) && fn());
    },
  };
})();
