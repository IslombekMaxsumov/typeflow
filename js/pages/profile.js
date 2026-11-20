/* Profile: your account stats (bests, charts, activity, recent tests) and
   settings (name, colour, log out, delete account). Guests see a log-in prompt. */
(function () {
  "use strict";
  const { t } = Core;
  const { el, icon } = Site;
  const view = document.getElementById("view");

  function guest() {
    view.replaceChildren(el("div", { class: "empty" },
      el("h1", { text: t("profile.guestTitle") }),
      el("p", { text: t("profile.guestText") }),
      el("a", { class: "btn", href: "login.html?next=profile.html", text: t("action.login") })
    ));
  }

  const dayKey = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };

  // 12 weeks × 7 days, darker = more tests that day.
  function activity(list) {
    const counts = new Map();
    list.forEach((r) => counts.set(dayKey(r.date), (counts.get(dayKey(r.date)) || 0) + 1));
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7 * 11);
    const cells = [];
    for (let i = 0; i < 84; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      if (d > today) break;
      const n = counts.get(dayKey(d)) || 0;
      const level = n === 0 ? 0 : n === 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 3 : 4;
      const label = Site.date(d) + ": " + t("profile.testsCount", { count: n });
      cells.push(el("span", { class: "cell lv-" + level, title: label }, el("span", { class: "visually-hidden", text: label })));
    }
    const active = [...counts.keys()].filter((k) => new Date(k) >= monday).length;
    return el("div", { class: "activity" },
      el("div", { class: "heat", role: "img", "aria-label": t("profile.activitySummary", { count: active }) }, cells),
      el("p", { class: "hint", text: t("profile.activitySummary", { count: active }) })
    );
  }

  function render() {
    const me = Store.current();
    if (!me) return guest();
    const list = Store.resultsOf(me.username); // newest first
    const lastTen = list.slice(0, 10);
    const avg = lastTen.length ? Math.round(lastTen.reduce((s, r) => s + r.wpm, 0) / lastTen.length) : 0;
    const best = list.reduce((b, r) => (!b || r.wpm > b.wpm ? r : b), null);
    const totalSeconds = list.reduce((s, r) => s + r.seconds, 0);

    // personal bests: timed modes × text languages
    const pbTable = el("table", { class: "pb-table" },
      el("thead", null, el("tr", null, el("td"), ["uz", "ru", "en"].map((l) => el("th", { scope: "col", text: Site.langLabel(l) })))),
      el("tbody", null, [15, 30, 60, 120].map((n) => el("tr", null,
        el("th", { scope: "row", text: t("mode.timeN", { n }) }),
        ["uz", "ru", "en"].map((l) => {
          const pb = Store.personalBest(me.username, "time", n, l);
          return el("td", { class: "num" }, pb ? [el("strong", { text: Site.num(pb.wpm) }), el("span", { class: "unit", text: " " + t("unit.wpm") })] : "—");
        })
      )))
    );

    const chrono = list.slice(0, 30).reverse();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const n = list.filter((r) => dayKey(r.date) === dayKey(d)).length;
      return { label: Site.date(d), short: String(d.getDate()), value: n, tip: t("profile.testsCount", { count: n }) };
    });

    const nameInput = el("input", { id: "pName", class: "input", value: me.name, maxlength: 30, autocomplete: "nickname" });
    // (a list of sections, flattened so replaceChildren gets nodes, not arrays)
    view.replaceChildren(...[
      el("div", { class: "profile-head" },
        Site.avatar(me, "lg"),
        el("div", null,
          el("h1", { text: me.name }),
          el("p", { class: "hint" }, "@" + me.username + " · " + t("profile.since", { date: Site.date(me.created, { year: true }) }),
            me.demo && el("span", { class: "demo-tag", text: t("profile.demo") }))
        )
      ),
      el("dl", { class: "stat-strip" },
        [[t("profile.tests"), Site.num(list.length)], [t("profile.timeTyping"), Site.duration(totalSeconds)],
          [t("profile.avg10"), avg ? Site.num(avg) + " " + t("unit.wpm") : "—"], [t("profile.best"), best ? Site.num(best.wpm) + " " + t("unit.wpm") : "—"]]
          .map(([k, v]) => el("div", null, el("dt", { text: k }), el("dd", { text: v })))
      ),
      list.length === 0
        ? el("div", { class: "empty" }, el("h2", { text: t("profile.noTests") }), el("a", { class: "btn", href: "index.html", text: t("board.takeTest") }))
        : [
          el("section", { class: "section", "aria-labelledby": "pbTitle" }, el("h2", { id: "pbTitle", text: t("profile.bests") }), el("div", { class: "table-wrap" }, pbTable)),
          el("section", { class: "section chart-section", "aria-labelledby": "wpmTitle" },
            el("h2", { id: "wpmTitle", text: t("profile.wpmChart") }),
            Charts.line(chrono.map((r) => ({ label: Site.date(r.date, { time: true }), short: Site.date(r.date), value: r.wpm, tip: t("live.wpm", { n: r.wpm }) + " · " + Site.modeLabel(r) })), { title: t("profile.wpmChart"), format: (v) => Site.num(v), valueHeader: t("res.wpm") })),
          el("section", { class: "section chart-section", "aria-labelledby": "accTitle" },
            el("h2", { id: "accTitle", text: t("profile.accChart") }),
            Charts.line(chrono.map((r) => ({ label: Site.date(r.date, { time: true }), short: Site.date(r.date), value: r.acc, tip: Site.pct(r.acc) })), { title: t("profile.accChart"), format: (v) => Math.round(v) + "%", valueHeader: t("res.acc") })),
          el("section", { class: "section chart-section", "aria-labelledby": "dayTitle" },
            el("h2", { id: "dayTitle", text: t("profile.perDay") }),
            Charts.bars(days, { title: t("profile.perDay"), format: (v) => Site.num(v), valueHeader: t("profile.tests") })),
          el("section", { class: "section", "aria-labelledby": "actTitle" }, el("h2", { id: "actTitle", text: t("profile.activity") }), activity(list)),
          el("section", { class: "section", "aria-labelledby": "recentTitle" },
            el("h2", { id: "recentTitle", text: t("profile.recent") }),
            el("div", { class: "table-wrap" }, el("table", { class: "recent-table" },
              el("thead", null, el("tr", null, ["board.date", "res.test", "opt.tlang", "res.wpm", "res.acc"].map((k, i) => el("th", { scope: "col", class: i >= 3 ? "num" : null, text: t(k) })))),
              el("tbody", null, list.slice(0, 15).map((r) => el("tr", null,
                el("td", { text: Site.date(r.date, { time: true }) }), el("td", { text: Site.modeLabel(r) }), el("td", { text: Site.langLabel(r.lang) }),
                el("td", { class: "num", text: Site.num(r.wpm) }), el("td", { class: "num", text: Site.pct(r.acc) })
              )))
            ))
          ),
        ],
      el("section", { class: "section settings", "aria-labelledby": "setTitle" },
        el("h2", { id: "setTitle", text: t("profile.settings") }),
        el("form", {
          class: "settings-form", novalidate: true,
          onsubmit: (e) => {
            e.preventDefault();
            if (nameInput.value.trim().length < 2) {
              nameInput.setAttribute("aria-invalid", "true");
              document.getElementById("pName-err").textContent = t("err.name");
              nameInput.focus();
              return;
            }
            Store.updateProfile({ name: nameInput.value });
            Core.toast(t("profile.saved"));
          },
        },
          el("div", { class: "field" },
            el("label", { for: "pName", text: t("auth.displayName") }), nameInput,
            el("p", { id: "pName-err", class: "field-error" })
          ),
          el("fieldset", { class: "field" },
            el("legend", { class: "field-label", text: t("profile.color") }),
            el("div", { class: "swatches" }, Store.COLORS.map((c, i) =>
              el("label", { class: "swatch-opt", style: `--av:${c}` },
                el("input", { type: "radio", name: "color", value: c, checked: c === me.color, onchange: () => Store.updateProfile({ color: c }) }),
                el("span", { class: "visually-hidden", text: t("profile.colorN", { n: i + 1 }) })
              )))
          ),
          el("button", { type: "submit", class: "btn", text: t("profile.save") })
        ),
        el("div", { class: "danger-zone" },
          el("button", { type: "button", class: "btn btn-ghost", onclick: () => { Store.logOut(); location.href = "index.html"; } }, icon("logout", 18), el("span", { text: t("action.logout") })),
          el("button", {
            type: "button", class: "btn btn-danger-ghost",
            onclick: async () => {
              const ok = await Site.confirm({ title: t("profile.deleteQ"), text: t("profile.deleteText"), ok: t("profile.delete"), danger: true });
              if (ok) {
                Store.deleteAccount();
                location.href = "index.html";
              }
            },
          }, el("span", { text: t("profile.delete") }))
        )
      ),
    ].flat());
  }

  Site.start(render, { title: () => (Store.current() ? Store.current().name : t("page.profile")) });
})();
