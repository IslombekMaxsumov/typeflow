// Builds css/palettes.css: the extra colour themes (Jade, the default, is
// hand-tuned in css/base.css). Run:  node tools/palettes.mjs
//
// Each theme only gives a few base colours per mode (page, surfaces, text,
// accent, two chart colours). Everything else is worked out here, and every
// text colour is nudged until it passes WCAG AA against the backgrounds it
// sits on: 4.5:1 for text, 3:1 for borders, the caret, chart lines and the
// large typing text that is not typed yet.
import { writeFileSync } from "node:fs";

const PALETTES = {
  ocean: {
    light: { bg: "#f2f5f8", surface: "#ffffff", raised: "#e5ecf2", ink: "#1b2733", accent: "#2b6a99", second: "#7a68b5", warm: "#b0782b" },
    dark: { bg: "#0f1923", surface: "#16232f", raised: "#1e2e3c", ink: "#e5edf4", accent: "#6cb0df", second: "#b4a7ea", warm: "#e5b56d" },
  },
  dusk: {
    light: { bg: "#f5f3f8", surface: "#ffffff", raised: "#ebe7f2", ink: "#251f38", accent: "#6a4fb4", second: "#2e8a85", warm: "#b0663f" },
    dark: { bg: "#17131f", surface: "#211b2b", raised: "#2b2438", ink: "#ece8f5", accent: "#b49df1", second: "#7ccfc6", warm: "#f0b394" },
  },
  rose: {
    light: { bg: "#f8f3f4", surface: "#ffffff", raised: "#f0e5e8", ink: "#33222a", accent: "#a9436a", second: "#4c7cae", warm: "#a6722b" },
    dark: { bg: "#1d1317", surface: "#291b21", raised: "#35242b", ink: "#f5e9ed", accent: "#f09ab6", second: "#9cbff0", warm: "#e9c27b" },
  },
  coral: {
    light: { bg: "#f3f4f6", surface: "#ffffff", raised: "#e7e9ed", ink: "#1f2430", accent: "#b84e36", second: "#3b7fa6", warm: "#8a6a1f" },
    dark: { bg: "#15171c", surface: "#1d2027", raised: "#262a33", ink: "#eceef2", accent: "#f08b72", second: "#86c1e3", warm: "#e2c46e" },
  },
  mono: {
    light: { bg: "#f4f4f4", surface: "#ffffff", raised: "#e9e9e9", ink: "#1a1a1a", accent: "#1a1a1a", second: "#5e5e5e", warm: "#7a7a7a" },
    dark: { bg: "#131313", surface: "#1c1c1c", raised: "#262626", ink: "#ededed", accent: "#ededed", second: "#b0b0b0", warm: "#8f8f8f" },
  },
};

/* ---------- colour helpers ---------- */
const hex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t)); // t=0 → a, t=1 → b
function lum(h) {
  const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Moves a colour toward black (light backgrounds) or white (dark ones) in
// small steps until it reaches `target` contrast against every background.
function fit(color, backgrounds, target) {
  const away = lum(backgrounds[0]) > 0.18 ? "#000000" : "#ffffff";
  let c = color;
  for (let step = 0; step < 60 && backgrounds.some((bg) => contrast(c, bg) < target); step++) c = mix(c, away, 0.04);
  return c;
}

/* ---------- one full set of tokens ---------- */
function tokens(p, mode) {
  const dark = mode === "dark";
  const textBgs = [p.bg, p.surface, p.raised];
  const accentSoft = mix(p.accent, p.surface, dark ? 0.82 : 0.88);
  const dangerBase = dark ? "#f08282" : "#b24649";
  const dangerSoft = mix(dangerBase, p.surface, dark ? 0.84 : 0.9);
  const danger = fit(dangerBase, [p.bg, p.surface, dangerSoft], 4.5);
  const warn = fit(p.warm, [p.bg, p.surface], 4.5);
  // white text on the accent button in light mode, page colour in dark mode
  const onAccent = dark ? p.bg : "#ffffff";
  const accent = fit(p.accent, [onAccent], 4.5);
  return {
    "color-scheme": mode,
    "--bg": p.bg, "--surface": p.surface, "--raised": p.raised, "--ink": p.ink,
    "--ink-2": fit(mix(p.ink, p.bg, 0.45), [...textBgs, accentSoft], 4.5), // also on your highlighted leaderboard row
    "--line": mix(p.ink, p.bg, dark ? 0.82 : 0.88),
    "--line-strong": fit(mix(p.ink, p.bg, 0.6), [p.bg, p.surface], 3),
    "--accent": accent,
    "--accent-hover": mix(accent, dark ? "#ffffff" : "#000000", 0.15),
    "--accent-text": fit(p.accent, [...textBgs, accentSoft], 4.5),
    "--on-accent": onAccent,
    "--accent-soft": accentSoft,
    "--ok": fit(dark ? "#80c99c" : "#2d7755", [p.bg, p.surface], 4.5),
    "--warn": warn,
    "--danger": danger,
    "--danger-soft": dangerSoft,
    "--t-untyped": fit(mix(p.ink, p.bg, 0.72), [p.bg], 3), // large text: 3:1
    "--t-correct": p.ink,
    "--t-wrong": danger,
    "--t-extra": warn,
    "--t-caret": fit(p.accent, [p.bg], 3),
    "--t-current": accentSoft,
    "--chart-wpm": fit(p.accent, [p.surface, p.bg], 3),
    "--chart-acc": fit(p.second, [p.surface, p.bg], 3),
    "--chart-act": fit(p.warm, [p.surface, p.bg], 3),
    "--chart-grid": mix(p.ink, p.surface, 0.9),
    "--toast-bg": p.ink,
    "--toast-ink": p.bg,
    "--toast-action": fit(dark ? mix(p.accent, "#000000", 0.35) : mix(p.accent, "#ffffff", 0.35), [p.ink], 4.5),
  };
}

/* ---------- write the CSS ---------- */
let css = `/* Colour themes, made by tools/palettes.mjs (do not edit by hand).
   Jade, the default theme, lives in base.css. The theme menu in the header
   sets <html data-palette="..."> and data-theme="light|dark". */\n`;
const swatches = {};
for (const [name, modes] of Object.entries(PALETTES)) {
  for (const mode of ["light", "dark"]) {
    const set = tokens(modes[mode], mode);
    css += `\n:root[data-palette="${name}"][data-theme="${mode}"] {\n`;
    for (const [k, v] of Object.entries(set)) css += `  ${k}: ${v};\n`;
    css += `}\n`;
    // a quick report so the numbers can be checked
    const report = [["ink-2", set["--ink-2"], modes[mode].raised], ["accent-text", set["--accent-text"], set["--accent-soft"]], ["on-accent", set["--on-accent"], set["--accent"]], ["untyped", set["--t-untyped"], modes[mode].bg]];
    console.log(name.padEnd(6), mode.padEnd(5), report.map(([k, a, b]) => `${k} ${contrast(a, b).toFixed(2)}`).join("  "));
    swatches[name] = swatches[name] || {};
    swatches[name][mode] = [set["--bg"], set["--accent"], set["--ink"]];
  }
}
writeFileSync(new URL("../css/palettes.css", import.meta.url), css);
console.log("\nswatches for js/layout.js:\n" + JSON.stringify(swatches));
