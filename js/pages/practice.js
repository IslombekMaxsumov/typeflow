/* Practice: short lessons per language with an on-screen keyboard that shows
   the next key. A lesson is passed at 95% accuracy or better. */
(function () {
  "use strict";
  const { t, store } = Core;
  const { el, icon } = Site;
  const $ = (id) => document.getElementById(id);
  const PASS = 95;
  let lang = ["uz", "ru", "en"].includes(store.get("plang", "")) ? store.get("plang", "") : null;
  let lesson = null;
  let test = null;

  const lessonsFor = (code) => LESSONS.filter((l) => l.lang === code);
  const currentLang = () => lang || Core.getLang();

  /* ---------- drills ---------- */
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function drill(l) {
    const words = TEXTS.words[l.lang];
    if (l.words === "common") return Array.from({ length: 15 }, () => pick(words.slice(0, 80)));
    if (l.words === "caps") {
      // capitals and punctuation: "Word," "Next." "Why?"
      return Array.from({ length: 15 }, (_, i) => {
        const w = pick(words.slice(0, 120));
        return (i % 2 ? w : w[0].toUpperCase() + w.slice(1)) + pick(["", "", ",", ".", "?", "!"]);
      });
    }
    if (l.words === "special") {
      const re = new RegExp(l.pattern);
      const matching = words.filter((w) => re.test(w));
      return Array.from({ length: 15 }, () => pick(matching));
    }
    if (/^\d+$/.test(l.letters)) return Array.from({ length: 15 }, () => String(Math.floor(Math.random() * 9000) + 10));
    // short made-up "words" from the lesson's letters (the usual way to learn a row)
    return Array.from({ length: 18 }, () => Array.from({ length: 2 + Math.floor(Math.random() * 4) }, () => pick([...l.letters])).join(""));
  }

  /* ---------- on-screen keyboard ---------- */
  function drawKeyboard(l) {
    const rows = KEYBOARDS[l.keyboard];
    const focus = new Set([...(l.letters || "")]);
    $("kbd").replaceChildren(
      ...rows.map((row) => el("div", { class: "kbd-row" }, [...row].map((k) => el("span", { class: "key" + (focus.has(k) ? " is-lesson" : ""), "data-key": k, text: k })))),
      el("div", { class: "kbd-row" }, el("span", { class: "key key-space", "data-key": " ", text: t("practice.space") }))
    );
  }
  function highlight(ch) {
    $("kbd").querySelectorAll(".is-next").forEach((k) => k.classList.remove("is-next"));
    if (!ch) return;
    let key = ch.toLowerCase();
    if (key === "'" || key === "ʻ") key = "'";
    const target = $("kbd").querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (target) target.classList.add("is-next");
  }

  /* ---------- list of lessons ---------- */
  function renderList() {
    const code = currentLang();
    document.querySelector(`[name="plang"][value="${code}"]`).checked = true;
    const progress = Store.lessonProgress();
    const list = lessonsFor(code);
    $("langProgress").textContent = t("practice.langProgress", { done: list.filter((l) => progress[l.id] && progress[l.id].passed).length, total: list.length });
    $("lessons").replaceChildren(
      ...lessonsFor(code).map((l) => {
        const p = progress[l.id];
        return el("li", null,
          el("button", { type: "button", class: "lesson-card" + (p && p.passed ? " is-passed" : ""), onclick: () => openLesson(l) },
            el("span", { class: "lesson-name", text: t("lesson." + l.key) }),
            el("span", { class: "lesson-keys", text: l.letters ? l.letters.split("").join(" ") : t("lesson." + l.key + "Hint") }),
            el("span", { class: "lesson-status" },
              p && p.passed ? icon("check", 16) : "",
              el("span", { text: p ? t("practice.bestAcc", { acc: Site.pct(p.best) }) : t("practice.notYet") })
            )
          )
        );
      })
    );
  }

  /* ---------- one lesson ---------- */
  function openLesson(l) {
    lesson = l;
    $("pick").hidden = true;
    $("lesson").hidden = false;
    $("lessonDone").hidden = true;
    $("nextLesson").hidden = true;
    $("lessonTitle").textContent = t("lesson." + l.key) + " · " + Site.langLabel(l.lang);
    $("lessonGoal").textContent = t("lesson." + l.key + "Info") + " " + t("practice.goal", { acc: PASS });
    drawKeyboard(l);
    startDrill();
    $("lessonTitle").focus();
  }
  function startDrill() {
    if (test) test.destroy();
    $("pwords").replaceChildren();
    const words = drill(lesson);
    $("psrText").textContent = t("test.srText", { text: words.join(" ") });
    $("lessonDone").hidden = true;
    test = Typing.create({
      host: $("pwords"), input: $("ptypeInput"), words, mode: "words", amount: words.length,
      onCaret: highlight,
      onTick: (s) => {
        $("pLiveProgress").textContent = `${Math.min(s.wordIndex, words.length)}/${words.length}`;
        $("pLiveWpm").textContent = s.wpm ? String(s.wpm) : "—"; // the label above already says WPM
        $("pLiveAcc").textContent = s.wpm ? Site.pct(s.acc) : "—";
      },
      onFinish: (r) => {
        const passed = r.acc >= PASS;
        Store.saveLesson(lesson.id, r.acc, passed);
        highlight("");
        const done = $("lessonDone");
        done.hidden = false;
        done.className = "lesson-done " + (passed ? "is-pass" : "is-fail");
        done.replaceChildren(
          el("strong", { text: t(passed ? "practice.passed" : "practice.failed") }),
          el("span", { text: t("practice.result", { wpm: r.wpm, acc: Site.pct(r.acc), goal: PASS }) })
        );
        const next = nextLessonOf(lesson);
        $("nextLesson").hidden = !(passed && next);
        ($("nextLesson").hidden ? $("retryLesson") : $("nextLesson")).focus();
      },
    });
    $("ptypeInput").focus();
  }
  function nextLessonOf(l) {
    const list = lessonsFor(l.lang);
    return list[list.indexOf(l) + 1] || null;
  }

  /* ---------- events ---------- */
  document.querySelector("#pick fieldset").addEventListener("change", (e) => {
    lang = e.target.value;
    store.set("plang", lang);
    renderList();
  });
  $("backToLessons").addEventListener("click", () => {
    if (test) test.destroy();
    $("lesson").hidden = true;
    $("pick").hidden = false;
    renderList();
    document.querySelector(".lesson-card").focus();
  });
  $("retryLesson").addEventListener("click", startDrill);
  $("nextLesson").addEventListener("click", () => openLesson(nextLessonOf(lesson)));
  $("pbox").addEventListener("click", () => $("ptypeInput").focus());
  $("ptypeInput").addEventListener("focus", () => $("pbox").classList.remove("is-blurred"));
  $("ptypeInput").addEventListener("blur", () => $("pbox").classList.add("is-blurred"));
  $("ptypeInput").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      $("retryLesson").focus();
    }
  });

  function render() {
    renderList();
    if (lesson && !$("lesson").hidden) {
      $("lessonTitle").textContent = t("lesson." + lesson.key) + " · " + Site.langLabel(lesson.lang);
      $("lessonGoal").textContent = t("lesson." + lesson.key + "Info") + " " + t("practice.goal", { acc: PASS });
      const space = $("kbd").querySelector(".key-space");
      if (space) space.textContent = t("practice.space");
    }
  }

  $("pbox").classList.add("is-blurred");
  Site.start(render, { title: () => t("page.practice"), onChange: () => $("lesson").hidden && renderList() });
})();
