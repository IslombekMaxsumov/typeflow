# Typing speed test (working name)

Site #5 of my 10-websites course project. A typing test and trainer in Uzbek, Russian and English, in plain HTML, CSS and JavaScript (no framework, no build step, no backend). The real name and look come from the design brief; the current styling is a placeholder.

**Demo account for checking:** login `demo`, password `demo123` (pre-filled with 10 weeks of results).

## Pages
| Page | What it does |
| --- | --- |
| `index.html` | The test: time (15/30/60/120 s) or words (10/25/50), text language, words or proverbs, punctuation and numbers. Live WPM and accuracy, results with a speed chart, personal-best badge |
| `practice.html` | Lessons per language (rows, special letters, numbers, common words) with an on-screen keyboard that lights up the next key; pass at 95% accuracy |
| `leaderboard.html` | Best result per player by mode, language and period (today / week / all time); you are highlighted |
| `profile.html` | Account stats: personal bests, speed and accuracy charts, tests per day, a 12-week activity grid, recent tests, settings (name, colour, log out, delete) |
| `login.html` | Log in and sign up with field checks, plus the demo account note |

## How it works
- `js/engine.js` reads typing through a hidden input (works with phone keyboards). WPM counts correctly typed words (5 characters = 1 word); raw WPM counts everything; accuracy = correct keystrokes / all keystrokes; consistency = how steady the speed was.
- `js/store.js` keeps accounts and results in localStorage. Passwords are stored as salted SHA-256 hashes, but without a server this is a demo, not real security. The leaderboard shows accounts in this browser plus demo players.
- `js/texts.js` holds the word lists, folk proverbs (public domain) and lessons.

Run locally: `node ../_shared/serve.mjs . 5177`.
