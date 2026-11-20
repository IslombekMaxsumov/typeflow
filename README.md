# typeflow — Find your rhythm.

Site #5 of my 10-websites course project. A calm typing test and trainer in Uzbek, Russian and English, in plain HTML, CSS and JavaScript (no framework, no build step, no backend).

**Demo account for checking:** login `demo`, password `demo123` (pre-filled with 10 weeks of results). Accounts are saved only in this browser.

## Pages
| Page | What it does |
| --- | --- |
| `index.html` | The test: time (15/30/60/120 s) or words (10/25/50), text language, words or proverbs, punctuation and numbers. Live WPM and accuracy, the Rhythm Line, pause when you click away, results with a speed chart and a personal-best badge |
| `practice.html` | 6 lessons per language (home row, top row, bottom row, special letters, numbers, common words) with an on-screen keyboard that lights up the next key; pass at 95% accuracy |
| `leaderboard.html` | Best result per player by mode, language and period (today / week / all time); you are highlighted. Players marked "demo" are made up |
| `profile.html` | Account stats: personal bests, speed and accuracy charts, tests per day, a 12-week activity grid, recent tests, settings (name, colour, log out, delete) |
| `login.html` | Log in and sign up with field checks, show/hide password, and the demo account note |

## Design
- Palette: muted jade, forest green and cool mist (light and dark). A few colours from the brief were darkened or lightened to pass WCAG AA; the original values are noted in `css/base.css`.
- Fonts: Onest (headings), Golos Text (text), IBM Plex Mono (the typing text and all numbers). All three have Cyrillic.
- Signature: the **Rhythm Line**, a thin line under the live stats that moves with each key you press and settles when you stop. The finished test and the profile show it as a still line.
- Logo: a "T" whose top bar is a wave (`assets/brand`): full logo for light and dark, one-colour version, symbol and favicon. The wordmark is converted to outlines, so it doesn't need the font. Keep free space around the logo of at least half the symbol's height.
- Icons: Lucide (ISC licence).

## How it works
- `js/engine.js` reads typing through a hidden input (works with phone keyboards). WPM counts correctly typed characters (5 characters = 1 word); raw WPM counts everything; accuracy = correct keystrokes / all keystrokes; consistency = how steady the speed was. Paused time doesn't count.
- `js/rhythm.js` draws the Rhythm Line (it stays still if you turn on reduced motion).
- `js/store.js` keeps accounts and results in localStorage. Passwords are stored as salted SHA-256 hashes, but without a server this is a demo, not real security. The leaderboard shows accounts in this browser plus demo players.
- `js/texts.js` holds the word lists, folk proverbs (public domain) and lessons.

Run locally: `node ../_shared/serve.mjs . 5177`.
