/* Test page: pick a mode and text, type, see live speed, then the results
   (saved to your account if you're logged in). */
(function () {
  "use strict";
  const { t, store } = Core;
  const { el } = Site;
  const $ = (id) => document.getElementById(id);
  const form = $("options");
  const input = $("typeInput");
  const box = $("box");

  /* ---------- options (remembered) ---------- */
  const saved = store.getJSON("opts", null) || {};
  const opts = {
    mode: /^(time-(15|30|60|120)|words-(10|25|50))$/.test(saved.mode) ? saved.mode : "time-30",
    tlang: ["uz", "ru", "en"].includes(saved.tlang) ? saved.tlang : null, // null: follow the interface language
    ttype: saved.ttype === "sentences" ? "sentences" : "words",
    punct: Boolean(saved.punct),
    nums: Boolean(saved.nums),
  };
  const textLang = () => opts.tlang || Core.getLang();
  const parsedMode = () => {
    const [kind, n] = opts.mode.split("-");
    return { kind, amount: Number(n) };
  };

  function fillForm() {
    form.querySelector(`[name="mode"][value="${opts.mode}"]`).checked = true;
    form.querySelector(`[name="tlang"][value="${textLang()}"]`).checked = true;
    form.querySelector(`[name="ttype"][value="${opts.ttype}"]`).checked = true;
    form.punct.checked = opts.punct;
    form.nums.checked = opts.nums;
  }

  /* ---------- the test ---------- */
  let currentWords = [];
  function newText() {
    const { kind, amount } = parsedMode();
    return Typing.makeText({ lang: textLang(), textType: opts.ttype, count: kind === "time" ? 120 : amount, punct: opts.punct, nums: opts.nums });
  }

  const { kind, amount } = parsedMode();
  let rhythm = Rhythm.create($("rhythm")); // the typeflow Rhythm Line under the live stats
  let test = null; // set right below; showLive() may run while it's being created
  test = makeTest(kind, amount, newText());

  function makeTest(kindNow, amountNow, words) {
    currentWords = words;
    $("srText").textContent = t("test.srText", { text: words.slice(0, 60).join(" ") });
    return Typing.create({
      host: $("words"), input, words, mode: kindNow, amount: amountNow,
      more: () => Typing.makeText({ lang: textLang(), textType: opts.ttype, count: 60, punct: opts.punct, nums: opts.nums }),
      onStart: () => {
        document.body.classList.add("is-typing");
        $("readyHint").hidden = true;
      },
      onKey: (time) => rhythm.pulse(time),
      onTick: showLive,
      onFinish: showResults,
    });
  }

  // Changing an option or pressing restart starts a fresh test.
  function restart(sameText = false) {
    test.destroy();
    const { kind, amount } = parsedMode();
    const words = sameText ? currentWords : newText();
    $("words").replaceChildren();
    rhythm.settle();
    rhythm = Rhythm.create($("rhythm"));
    test = makeTest(kind, amount, words);
    $("readyHint").hidden = false;
    document.body.classList.remove("is-typing");
    $("results").hidden = true;
    $("testArea").hidden = false;
    input.disabled = false;
    input.value = "";
    input.focus();
  }

  // Time left (or words typed) is always shown; WPM and accuracy once you start.
  function showLive(s) {
    const { kind, amount } = parsedMode();
    const running = test && test.isRunning();
    $("liveProgress").previousElementSibling.textContent = t(kind === "time" ? "live.timeLeft" : "live.words");
    $("liveProgress").textContent = kind === "time" ? String(Math.max(0, amount - s.elapsed)) : `${Math.min(s.wordIndex, amount)}/${amount}`;
    $("liveWpm").textContent = running ? Site.num(s.wpm) : "—";
    $("liveAcc").textContent = running ? Site.pct(s.acc) : "—";
    // Beat ticks under the Rhythm Line: one per second (or per word), filled as you go.
    const beats = kind === "time" ? Math.min(amount, 60) : amount;
    const done = kind === "time" ? s.elapsed / amount : Math.min(s.wordIndex, amount) / amount;
    $("rhythm").style.setProperty("--n", beats);
    $("rhythm").style.setProperty("--p", Math.max(0, Math.min(1, done || 0)).toFixed(3));
  }

  /* ---------- results ---------- */
  let last = null;
  function showResults(r) {
    rhythm.settle();
    document.body.classList.remove("is-typing");
    input.blur();
    const full = { ...r, lang: textLang(), textType: opts.ttype, punct: opts.punct, nums: opts.nums };
    const { result, isBest, previous } = Store.addResult(full);
    last = { result, isBest, previous };
    $("testArea").hidden = true;
    $("results").hidden = false;
    renderResults();
    $("resTitle").focus();
    $("srLive").textContent = t("res.announce", { wpm: r.wpm, acc: Site.pct(r.acc) });
  }

  function renderResults() {
    if (!last) return;
    const { result: r, isBest, previous } = last;
    $("resWpm").textContent = Site.num(r.wpm);
    $("resAcc").textContent = Site.pct(r.acc);
    $("resBest").hidden = !(isBest && previous);
    const c = r.chars;
    $("resStats").replaceChildren(
      ...[
        [t("res.raw"), Site.num(r.raw)],
        [t("res.consistency"), Site.pct(r.consistency)],
        [t("res.chars"), `${c.correct} / ${c.wrong} / ${c.extra} / ${c.missed}`],
        [t("res.time"), Site.duration(r.seconds)],
        [t("res.test"), Site.modeLabel(r) + " · " + Site.langLabel(r.lang)],
      ].map(([k, v]) => el("div", null, el("dt", { text: k }), el("dd", { text: v })))
    );
    $("resStats").querySelector("div:nth-child(3) dt").title = t("res.charsHelp");
    Rhythm.still($("resRhythm"), r.series);
    $("resChart").replaceChildren(
      r.series.length > 1
        ? Charts.line(r.series.map((v, i) => ({ label: t("res.second", { n: i + 1 }), short: String(i + 1), value: v, tip: t("live.wpm", { n: v }) })), {
          title: t("res.chartTitle"), format: (v) => Site.num(v), valueHeader: t("res.wpm"),
        })
        : ""
    );
    const me = Store.current();
    $("resGuest").hidden = Boolean(me);
    if (!me) {
      $("resGuest").replaceChildren(t("res.guest") + " ", el("a", { href: "login.html?next=index.html", text: t("action.login") }));
    }
  }

  /* ---------- events ---------- */
  form.addEventListener("change", () => {
    opts.mode = form.querySelector('[name="mode"]:checked').value;
    opts.tlang = form.querySelector('[name="tlang"]:checked').value;
    opts.ttype = form.querySelector('[name="ttype"]:checked').value;
    opts.punct = form.punct.checked;
    opts.nums = form.nums.checked;
    store.setJSON("opts", opts);
    restart();
  });
  $("restart").addEventListener("click", () => restart());
  $("nextTest").addEventListener("click", () => restart());
  $("repeatTest").addEventListener("click", () => restart(true));

  // Tab from the text jumps to Restart (then Enter restarts); Esc comes back to the text.
  input.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      $("restart").focus();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("testArea").hidden) input.focus();
  });

  // Clicking the text focuses the hidden input; a hint shows when it isn't focused.
  // Clicking the text focuses it. Leaving it pauses a running test (the timer
  // stops) and says so; coming back continues.
  const setHint = () => {
    $("focusHint").textContent = t(test && test.isPaused() ? "test.paused" : "test.focus");
  };
  box.addEventListener("click", () => input.focus());
  input.addEventListener("focus", () => {
    box.classList.remove("is-blurred", "is-paused");
    test.resume();
    keepVisible();
  });
  input.addEventListener("blur", () => {
    if (test.isRunning()) {
      test.pause();
      box.classList.add("is-paused");
    }
    box.classList.add("is-blurred");
    setHint();
  });
  // Phones: keep the text in view above the on-screen keyboard.
  const narrow = matchMedia("(max-width: 760px)");
  function keepVisible() {
    if (!narrow.matches) return;
    setTimeout(() => box.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 60);
  }
  if (window.visualViewport) visualViewport.addEventListener("resize", () => document.activeElement === input && keepVisible());

  function render() {
    // The interface language changed: the hint texts change; the text being typed stays.
    fillForm();
    setHint();
    showLive({ elapsed: 0, wordIndex: 0, wpm: 0, acc: 100 });
    renderResults();
    test.placeCaret();
  }

  box.classList.add("is-blurred");
  Site.start(render, { title: () => t("page.test"), onChange: renderResults }).then(() => {
    // first visit: text language = interface language
    if (!opts.tlang) restart();
  });
})();
