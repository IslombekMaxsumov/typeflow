/* Small SVG charts drawn by hand: bars, a line and a donut.
   Every bar/point can be focused with the keyboard and shows a tooltip, and
   every chart comes with a "show as table" version for screen readers.

   items: [{ label, value, tip }]  (tip = the text in the tooltip) */
(function () {
  "use strict";
  const { t } = Core;
  const { el, svgEl } = Site;
  const W = 640; // drawing width; the SVG scales to the container
  const PAD = { top: 16, right: 8, bottom: 28, left: 44 };

  // A nice round top for the y axis (e.g. 1 234 → 1 500).
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function frame(items, H, format, goal) {
    const max = niceMax(Math.max(goal || 0, ...items.map((i) => i.value)));
    const innerH = H - PAD.top - PAD.bottom;
    const y = (v) => PAD.top + innerH - (v / max) * innerH;
    const grid = [0, 0.5, 1].map((f) =>
      svgEl("g", { class: "grid" },
        svgEl("line", { x1: PAD.left, x2: W - PAD.right, y1: y(max * f), y2: y(max * f) }),
        svgEl("text", { x: PAD.left - 8, y: y(max * f) + 4, "text-anchor": "end" }, document.createTextNode(format(max * f)))
      )
    );
    const goalLine = goal ? svgEl("g", { class: "goal-line" },
      svgEl("line", { x1: PAD.left, x2: W - PAD.right, y1: y(goal), y2: y(goal) }),
      svgEl("text", { x: W - PAD.right, y: y(goal) - 5, "text-anchor": "end" }, document.createTextNode(t("chart.goal")))
    ) : null;
    return { max, y, grid, goalLine, innerH };
  }

  // Tooltip that follows the focused/hovered mark.
  function withTooltip(wrap, svg) {
    const tip = el("div", { class: "chart-tip", role: "status", hidden: true });
    const show = (mark) => {
      tip.textContent = mark.getAttribute("aria-label");
      tip.hidden = false;
      const box = mark.getBoundingClientRect();
      const host = wrap.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(box.left + box.width / 2 - host.left, 60), host.width - 60) + "px";
      tip.style.top = box.top - host.top + "px";
    };
    svg.addEventListener("pointerover", (e) => e.target.closest(".mark") && show(e.target.closest(".mark")));
    svg.addEventListener("focusin", (e) => e.target.closest(".mark") && show(e.target.closest(".mark")));
    svg.addEventListener("pointerleave", () => (tip.hidden = true));
    svg.addEventListener("focusout", () => (tip.hidden = true));
    wrap.append(tip);
  }

  function table(items, headers) {
    return el("details", { class: "chart-table" },
      el("summary", { text: t("chart.table") }),
      el("table", null,
        el("thead", null, el("tr", null, headers.map((h) => el("th", { scope: "col", text: h })))),
        el("tbody", null, items.map((i) => el("tr", null, el("th", { scope: "row", text: i.label }), el("td", { text: i.tip }))))
      )
    );
  }

  function bars(items, { title, format = String, goal = 0, height = 220, valueHeader }) {
    const H = height;
    const { y, grid, goalLine } = frame(items, H, format, goal);
    const slot = (W - PAD.left - PAD.right) / items.length;
    const bw = Math.min(44, slot * 0.62);
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": title },
      grid,
      items.map((it, i) => {
        const x = PAD.left + slot * i + (slot - bw) / 2;
        const top = y(it.value);
        return svgEl("g", null,
          svgEl("rect", {
            class: "mark bar" + (goal && it.value >= goal ? " is-hit" : "") + (i === items.length - 1 ? " is-current" : ""), x, y: top, width: bw,
            height: Math.max(0, y(0) - top), rx: 3, tabindex: 0, "aria-label": it.label + ": " + it.tip,
          }),
          svgEl("text", { class: "x-label", x: x + bw / 2, y: H - 8, "text-anchor": "middle" }, document.createTextNode(it.short || it.label))
        );
      }),
      goalLine
    );
    const wrap = el("div", { class: "chart-wrap" }, svg);
    withTooltip(wrap, svg);
    return el("div", { class: "chart-box" }, wrap, table(items, ["", valueHeader || title]));
  }

  function line(items, { title, format = String, height = 220, valueHeader }) {
    const H = height;
    const { y, grid } = frame(items, H, format, 0);
    const step = items.length > 1 ? (W - PAD.left - PAD.right - 20) / (items.length - 1) : 0;
    const x = (i) => PAD.left + 10 + step * i;
    const d = items.map((it, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(it.value).toFixed(1)).join(" ");
    const every = Math.ceil(items.length / 8); // don't crowd the x labels
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": title },
      grid,
      items.length > 1 && svgEl("path", { class: "line", d, fill: "none" }),
      items.map((it, i) => svgEl("g", null,
        svgEl("circle", { class: "mark dot", cx: x(i), cy: y(it.value), r: 5, tabindex: 0, "aria-label": it.label + ": " + it.tip }),
        i % every === 0 && svgEl("text", { class: "x-label", x: x(i), y: H - 8, "text-anchor": "middle" }, document.createTextNode(it.short || it.label))
      ))
    );
    const wrap = el("div", { class: "chart-wrap" }, svg);
    withTooltip(wrap, svg);
    return el("div", { class: "chart-box" }, wrap, table(items, ["", valueHeader || title]));
  }

  // items: [{ label, value, tip, cls }] — a ring split into parts, with a legend.
  function donut(items, { title, centre }) {
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    const r = 40;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const svg = svgEl("svg", { viewBox: "0 0 100 100", class: "donut", role: "img", "aria-label": title },
      svgEl("circle", { class: "ring-track", cx: 50, cy: 50, r, fill: "none", "stroke-width": 14 }),
      items.filter((i) => i.value > 0).map((it) => {
        const len = (it.value / total) * c;
        const seg = svgEl("circle", {
          class: "mark seg " + it.cls, cx: 50, cy: 50, r, fill: "none", "stroke-width": 14,
          "stroke-dasharray": `${Math.max(0, len - 1).toFixed(2)} ${c.toFixed(2)}`, "stroke-dashoffset": (-offset).toFixed(2),
          transform: "rotate(-90 50 50)", tabindex: 0, "aria-label": it.label + ": " + it.tip,
        });
        offset += len;
        return seg;
      }),
      svgEl("text", { x: 50, y: 54, "text-anchor": "middle", class: "donut-centre" }, document.createTextNode(centre))
    );
    const wrap = el("div", { class: "chart-wrap donut-wrap" }, svg,
      el("ul", { class: "legend" }, items.map((i) => el("li", { class: i.cls }, el("span", { class: "swatch", "aria-hidden": "true" }), el("span", { text: i.label }), el("strong", { text: i.tip }))))
    );
    withTooltip(wrap, svg);
    return el("div", { class: "chart-box" }, wrap);
  }

  window.Charts = { bars, line, donut };
})();
