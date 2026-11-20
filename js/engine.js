/* The typing engine, used by the Test and Practice pages.

   How typing is read: a hidden <input> holds the word you are typing right
   now (this also works with phone keyboards). Space finishes the word. Each
   letter on screen is a <span> marked as correct, wrong, extra (typed past the
   end of the word) or missed (left out of a finished word).

   Speed (WPM) counts only correctly typed words, 5 characters = 1 word, like
   most typing tests. Raw WPM counts every character typed. Accuracy is the
   share of keystrokes that were right. Consistency is how steady the speed
   was from second to second (100 = perfectly even). */
(function () {
  "use strict";

  /* ---------- making a text ---------- */
  function rnd(n) { return Math.floor(Math.random() * n); }
  const pick = (list) => list[rnd(list.length)];

  // words: how many; textType "words" or "sentences"; punctuation and numbers optional.
  function makeText({ lang = "en", textType = "words", count = 60, punct = false, nums = false }) {
    let out = [];
    if (textType === "sentences") {
      while (out.length < count) out.push(...pick(TEXTS.sentences[lang]).split(" "));
      return out.slice(0, Math.max(count, out.length));
    }
    const list = TEXTS.words[lang];
    let prev = "";
    for (let i = 0; i < count; i++) {
      let w = pick(list);
      while (w === prev) w = pick(list);
      prev = w;
      if (nums && Math.random() < 0.12) w = String(rnd(1000));
      if (punct) {
        if (i === 0 || /[.!?]$/.test(out[i - 1] || "")) w = w.charAt(0).toUpperCase() + w.slice(1);
        const r = Math.random();
        if (r < 0.08) w += ",";
        else if (r < 0.14) w += ".";
        else if (r < 0.16) w += "?";
      }
      out.push(w);
    }
    return out;
  }

  /* ---------- the test ---------- */
  // options: { host, input, words, mode: "time"|"words", amount, more: () => [words],
  //            onStart, onTick(stats), onFinish(result), onCaret(nextChar) }
  function create(options) {
    const { host, input } = options;
    let words, typed, wi, started, finished, startTime, timer, elapsed, keys, series, perSecond, firstVisible;

    function reset(newWords) {
      clearInterval(timer);
      words = newWords.slice();
      typed = words.map(() => "");
      wi = 0;
      started = false;
      finished = false;
      elapsed = 0;
      keys = { total: 0, correct: 0, thisSecond: 0 };
      series = [];
      perSecond = [];
      firstVisible = 0;
      input.value = "";
      draw();
      tick(false);
    }

    /* drawing */
    function wordEl(w) {
      const el = document.createElement("div");
      el.className = "word";
      for (const ch of w) {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        el.append(s);
      }
      return el;
    }
    function draw() {
      host.querySelectorAll(".word").forEach((n) => n.remove());
      const caret = host.querySelector(".caret") || Object.assign(document.createElement("span"), { className: "caret" });
      caret.setAttribute("aria-hidden", "true");
      host.append(...words.map(wordEl), caret);
      words.forEach((_, i) => paint(i));
      placeCaret();
    }
    // Marks every letter of word i.
    function paint(i) {
      const el = host.querySelectorAll(".word")[i];
      if (!el) return;
      const target = words[i];
      const t = typed[i];
      const done = i < wi;
      el.querySelectorAll(".extra").forEach((n) => n.remove());
      [...el.children].forEach((s, k) => {
        s.className = "ch" + (k < t.length ? (t[k] === target[k] ? " ok" : " bad") : done ? " miss" : "");
        if (k < t.length && t[k] !== target[k]) s.dataset.typed = t[k];
        else delete s.dataset.typed;
      });
      for (let k = target.length; k < t.length; k++) {
        const s = document.createElement("span");
        s.className = "ch extra";
        s.textContent = t[k];
        el.append(s);
      }
      el.classList.toggle("is-current", i === wi && !finished);
      el.classList.toggle("is-error", done && t !== target);
    }
    function placeCaret() {
      const caret = host.querySelector(".caret");
      const el = host.querySelectorAll(".word")[wi];
      if (!caret || !el) return;
      const letters = el.querySelectorAll(".ch");
      const at = typed[wi].length;
      const box = host.getBoundingClientRect();
      let x, y, h;
      if (at < letters.length) {
        const r = letters[at].getBoundingClientRect();
        x = r.left; y = r.top; h = r.height;
      } else {
        const r = (letters[letters.length - 1] || el).getBoundingClientRect();
        x = r.right; y = r.top; h = r.height;
      }
      caret.style.transform = `translate(${x - box.left + host.scrollLeft}px, ${y - box.top + host.scrollTop}px)`;
      caret.style.height = h + "px";
      scrollLines(el);
      if (options.onCaret) options.onCaret(nextChar());
    }
    // Keeps the current word on the first or second of three visible lines.
    function scrollLines(current) {
      const all = host.querySelectorAll(".word");
      const first = all[firstVisible];
      if (!first || !current) return;
      const line = first.offsetHeight + parseFloat(getComputedStyle(first).marginBottom || 0);
      if (line <= 0) return; // not drawn yet (e.g. a hidden tab)
      if (current.offsetTop - first.offsetTop >= line * 2 - 2) {
        const top = first.offsetTop;
        const before = firstVisible;
        while (all[firstVisible] && all[firstVisible].offsetTop === top && firstVisible < wi) {
          all[firstVisible].hidden = true;
          firstVisible++;
        }
        if (firstVisible > before) placeCaret(); // only redo it if a line really moved
      }
    }
    const nextChar = () => {
      if (finished) return "";
      const t = typed[wi];
      const w = words[wi] || "";
      return t.length < w.length ? w[t.length] : " ";
    };

    /* numbers */
    function stats() {
      const minutes = Math.max(elapsed, 0.5) / 60;
      let goodChars = 0;
      const chars = { correct: 0, wrong: 0, extra: 0, missed: 0 };
      for (let i = 0; i <= Math.min(wi, words.length - 1); i++) {
        const t = typed[i];
        const w = words[i];
        for (let k = 0; k < Math.max(t.length, w.length); k++) {
          if (k >= w.length) chars.extra++;
          else if (k >= t.length) { if (i < wi) chars.missed++; }
          else if (t[k] === w[k]) chars.correct++;
          else chars.wrong++;
        }
        if (i < wi && t === w) goodChars += w.length + 1; // + the space
        if (i === wi && finished && t === w) goodChars += w.length;
      }
      const wpm = Math.round(goodChars / 5 / minutes);
      const raw = Math.round(keys.total / 5 / minutes);
      const acc = keys.total ? Math.round((keys.correct / keys.total) * 1000) / 10 : 100;
      return { wpm: started ? wpm : 0, raw: started ? raw : 0, acc, chars, elapsed, wordIndex: wi, words: words.length };
    }
    function consistency() {
      const v = perSecond.filter((x, i) => i > 0 || x > 0);
      if (v.length < 2) return 100;
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      if (!mean) return 0;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
      return Math.max(0, Math.round(100 - (sd / mean) * 100));
    }
    function tick(advance = true) {
      if (advance) {
        elapsed++;
        perSecond.push(keys.thisSecond * 12); // chars in one second → raw WPM
        keys.thisSecond = 0;
        series.push(stats().wpm);
        if (options.mode === "time" && elapsed >= options.amount) return finish();
      }
      if (options.onTick) options.onTick(stats());
    }

    /* typing */
    function start() {
      started = true;
      startTime = Date.now();
      timer = setInterval(() => tick(true), 1000);
      if (options.onStart) options.onStart();
    }
    function commitWord(word) {
      keys.total++;
      keys.thisSecond++;
      if (word === words[wi]) keys.correct++;
      typed[wi] = word;
      wi++;
      paint(wi - 1);
      // time tests never run out of words
      if (options.mode === "time" && wi > words.length - 25 && options.more) {
        const extra = options.more();
        const start = words.length;
        words.push(...extra);
        typed.push(...extra.map(() => ""));
        host.querySelector(".caret").before(...extra.map(wordEl));
        extra.forEach((_, k) => paint(start + k));
      }
      if (options.mode === "words" && wi >= words.length) return finish();
      paint(wi);
      placeCaret();
    }

    function onInput() {
      if (finished) {
        input.value = "";
        return;
      }
      if (!started && input.value.trim()) start();
      let v = input.value;
      if (v.includes(" ")) {
        const [word, ...rest] = v.split(" ");
        input.value = rest.join(" ").trimStart();
        if (word) commitWord(word);
        v = input.value;
        if (!v) return;
      }
      const prev = typed[wi];
      if (v.length > prev.length) {
        const added = v.slice(prev.length);
        for (let k = 0; k < added.length; k++) {
          keys.total++;
          keys.thisSecond++;
          if (words[wi][prev.length + k] === added[k]) keys.correct++;
        }
      }
      typed[wi] = v;
      paint(wi);
      placeCaret();
      // A words test ends as soon as the last word is typed right.
      if (options.mode === "words" && wi === words.length - 1 && v === words[wi]) finish();
    }

    // Backspace on an empty word goes back to the previous word, but only if
    // that word has a mistake (correct words stay done).
    function onKey(e) {
      if (e.key === "Backspace" && input.value === "" && wi > 0 && typed[wi - 1] !== words[wi - 1] && !finished) {
        e.preventDefault();
        wi--;
        input.value = typed[wi];
        paint(wi + 1);
        paint(wi);
        placeCaret();
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      if (elapsed === 0 || options.mode === "words") {
        // a words test can end mid-second: count the real time
        elapsed = Math.max(1, Math.round((Date.now() - startTime) / 100) / 10);
      }
      const s = stats();
      paint(wi);
      host.querySelector(".caret").hidden = true;
      options.onFinish({
        mode: options.mode, amount: options.amount, wpm: s.wpm, raw: s.raw, acc: s.acc,
        consistency: consistency(), chars: s.chars, seconds: Math.round(elapsed * 10) / 10,
        series: series.length ? series : [s.wpm],
      });
    }

    // Listeners are removed by destroy(), so an old test never keeps
    // reacting to typing after a new one has started.
    const onResize = () => placeCaret();
    input.addEventListener("input", onInput);
    input.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    reset(options.words);
    return {
      destroy: () => {
        clearInterval(timer);
        input.removeEventListener("input", onInput);
        input.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", onResize);
      },
      reset: (w) => {
        host.querySelector(".caret").hidden = false;
        host.querySelectorAll(".word").forEach((n) => (n.hidden = false));
        reset(w);
      },
      stop: () => clearInterval(timer),
      isRunning: () => started && !finished,
      words: () => words.slice(0, Math.max(wi + 1, 1)),
      placeCaret,
    };
  }

  window.Typing = { makeText, create };
})();
