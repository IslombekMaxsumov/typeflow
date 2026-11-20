/* The typeflow Rhythm Line: one thin, smooth curve (not an equalizer).

   While you type, every keystroke nudges the line. Even typing makes small,
   regular waves; uneven gaps between keys make them a bit taller. When you
   pause the line calms down to flat, and when the test ends it settles into
   a static line. With "reduce motion" it never animates.

   Rhythm.create(host)              live line for the Test and Practice pages
     .pulse(time)                   call on every keystroke (performance.now())
     .settle()                      stop and flatten
   Rhythm.still(host, values)       a static line from data (results, profile) */
(function () {
  "use strict";
  const W = 600;
  const H = 28;
  const MID = H / 2;
  const N = 48; // points along the line
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function svgFor(host) {
    host.replaceChildren();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "rhythm-path");
    path.setAttribute("fill", "none");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    svg.append(path);
    host.append(svg);
    return path;
  }

  // A smooth curve through the points (midpoint quadratic smoothing).
  function curve(values) {
    const step = W / (values.length - 1);
    const pts = values.map((v, i) => [i * step, MID - Math.max(-1, Math.min(1, v)) * (MID - 3)]);
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      d += ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`;
    }
    return d + ` L${pts[pts.length - 1][0]} ${pts[pts.length - 1][1].toFixed(1)}`;
  }

  function create(host) {
    const path = svgFor(host);
    let values = new Array(N).fill(0);
    let last = 0;
    let avg = 0;
    let sign = 1;
    let raf = 0;
    let idleFrames = 0;
    const draw = () => path.setAttribute("d", curve(values));

    function loop() {
      // calm down a little every frame; stop once it's flat
      idleFrames++;
      const fade = idleFrames > 20 ? 0.9 : 0.985;
      values = values.map((v) => v * fade);
      draw();
      if (values.some((v) => Math.abs(v) > 0.01)) raf = requestAnimationFrame(loop);
      else raf = 0;
    }

    draw();
    host.classList.remove("is-static");
    return {
      pulse(time) {
        if (reduce()) return;
        const gap = last ? time - last : 0;
        last = time;
        if (!gap || gap > 1500) return; // first key or after a pause
        avg = avg ? avg * 0.85 + gap * 0.15 : gap;
        const unevenness = Math.min(1, Math.abs(gap - avg) / avg);
        sign = -sign;
        values.shift();
        values.push(sign * (0.25 + 0.6 * unevenness));
        idleFrames = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      },
      settle() {
        cancelAnimationFrame(raf);
        raf = 0;
        values = values.map(() => 0);
        draw();
        host.classList.add("is-static");
      },
    };
  }

  // Static line from numbers (e.g. WPM per second): how far each is from the average.
  function still(host, numbers) {
    const path = svgFor(host);
    host.classList.add("is-static");
    if (!numbers || numbers.length < 2) return path.setAttribute("d", curve([0, 0]));
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length || 1;
    const spread = Math.max(...numbers.map((v) => Math.abs(v - mean))) || 1;
    path.setAttribute("d", curve(numbers.map((v) => ((v - mean) / spread) * 0.8)));
  }

  window.Rhythm = { create, still };
})();
