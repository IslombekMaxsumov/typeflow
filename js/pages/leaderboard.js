/* Leaderboard: each player's best timed result for a mode, text language
   and period. "You" are highlighted, and shown below the top 20 if needed. */
(function () {
  "use strict";
  const { t, store } = Core;
  const { el } = Site;
  const $ = (id) => document.getElementById(id);
  const form = $("filters");
  const pick = Site.picks(form); // filters as one short line of menus
  const TOP = 20;
  const saved = store.getJSON("board", null) || {};
  const state = {
    amount: [15, 30, 60].includes(saved.amount) ? saved.amount : 30,
    lang: ["uz", "ru", "en"].includes(saved.lang) ? saved.lang : "en",
    period: ["today", "week", "all"].includes(saved.period) ? saved.period : "all",
  };

  function row(entry, me) {
    const r = entry.result;
    const isMe = me && entry.user.username === me.username;
    return el("tr", { class: (isMe ? "is-me" : "") + (entry.rank <= 3 ? " top-" + entry.rank : "") },
      el("td", { class: "rank" }, el("span", { class: "rank-num", text: String(entry.rank) })),
      el("th", { scope: "row", class: "player" },
        Site.avatar(entry.user, "sm"),
        el("span", { class: "player-name", text: entry.user.name }),
        isMe && el("span", { class: "you-tag", text: t("board.you") })
      ),
      el("td", { class: "num wpm", text: Site.num(r.wpm) }),
      el("td", { class: "num", text: Site.pct(r.acc) }),
      el("td", { class: "date", text: Site.date(r.date) })
    );
  }

  function render() {
    form.querySelector(`[name="amount"][value="${state.amount}"]`).checked = true;
    form.querySelector(`[name="blang"][value="${state.lang}"]`).checked = true;
    form.querySelector(`[name="period"][value="${state.period}"]`).checked = true;
    pick.refresh();
    const list = Store.leaderboard(state);
    const me = Store.current();
    const mine = me ? list.find((e) => e.user.username === me.username) : null;

    $("boardCount").textContent = t("board.count", { count: list.length, test: t("mode.timeN", { n: state.amount }), lang: Site.langLabel(state.lang) });
    $("boardEmpty").hidden = list.length > 0;
    $("board").hidden = list.length === 0;
    $("board").replaceChildren(
      el("caption", { class: "visually-hidden", text: t("board.caption", { test: t("mode.timeN", { n: state.amount }), lang: Site.langLabel(state.lang) }) }),
      el("thead", null, el("tr", null, ["board.rank", "board.player", "res.wpm", "res.acc", "board.date"].map((k, i) =>
        el("th", { scope: "col", class: i >= 2 && i <= 3 ? "num" : null, text: t(k) })))),
      el("tbody", null,
        list.slice(0, TOP).map((e) => row(e, me)),
        mine && mine.rank > TOP && [el("tr", { class: "gap", "aria-hidden": "true" }, el("td", { colspan: 5, text: "…" })), row(mine, me)]
      )
    );

    const you = $("you");
    you.replaceChildren();
    if (!me) you.append(t("board.guest") + " ", el("a", { href: "login.html?next=leaderboard.html", text: t("action.login") }));
    else if (!mine) you.append(t("board.noResult") + " ", el("a", { href: "index.html", text: t("board.takeTest") }));
    else you.append(t("board.yourRank", { rank: mine.rank, count: list.length }));
  }

  form.addEventListener("change", () => {
    state.amount = Number(form.querySelector('[name="amount"]:checked').value);
    state.lang = form.querySelector('[name="blang"]:checked').value;
    state.period = form.querySelector('[name="period"]:checked').value;
    store.setJSON("board", state);
    render();
  });

  Site.start(render, { title: () => t("page.leaderboard") });
})();
