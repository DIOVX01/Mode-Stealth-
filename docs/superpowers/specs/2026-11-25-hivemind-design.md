# HiveMind — Design

Date: 2026-11-25 · Status: draft for approval

## 1. Intent

The user feels their memory and attention have declined. They forget names and faces, what they just read or heard, tasks and where they put things, and study/work facts — and they don't notice or remember what happens around them. They want a rigorous, no-mercy daily trainer (45+ min/day) that adapts to them and shows **measured, visible** improvement over time.

Success = after weeks of daily use, the user can see on a chart that their scores on a fixed weekly test went up, and they recall their own real material (people, facts, reading) reliably.

## 2. Evidence base (what the design rests on)

| Finding | Source | Design consequence |
|---|---|---|
| Brain training improves the trained tasks; transfer to related tasks is weaker; little evidence of transfer to everyday cognition (review of 132 papers). | Simons et al. 2016, *Psychological Science in the Public Interest* 17(3) | Train the exact real-life skills directly. Never claim IQ/"general thinking" gains. Measure with a fixed benchmark. |
| Practice testing (retrieval) and spaced practice are the highest-utility learning techniques. | Dunlosky et al. 2013; Roediger & Karpicke 2006; Cepeda et al. 2006 | User's own material is reviewed by spaced retrieval (flashcard scheduler), never by re-reading. |
| Method of loci (memory palace): untrained people trained ~30 min/day for ~6 weeks went from ~26 to ~62 of 72 words; >22 extra words still retained at 4 months. Working-memory (n-back) group kept no gains. | Dresler et al. 2017, *Neuron* | Memory-palace drill is a core daily item. No n-back drill. |
| Optimal training difficulty ≈ 85% accuracy (shown for simple right/wrong tasks). | Wilson et al. 2019, *Nature Communications* 10:4646 | Every drill's difficulty self-adjusts to hold the user near 85% correct. |
| People miss large unattended changes (change blindness); observation improves with structured practice + feedback. | Simons & Levin 1998; Naghshineh et al. 2008 (art-observation training, med students) | "What changed?" and Kim's-game drills with immediate feedback. |
| Humans track ~4 moving objects at once (multiple-object tracking). | Pylyshyn & Storm 1988 | Cups/tracking drill starts at 2 targets, adapts upward. |

Outside the app but stronger than any app: sleep and aerobic exercise. The dashboard shows a one-line reminder; nothing more.

## 3. Goals

- Fixed daily session (~45 min) the user cannot cherry-pick; difficulty adapts per drill toward ~85% accuracy.
- Spaced-retrieval review of the user's own material: people, facts, reading.
- Generic adaptive drills for observation, location memory, prospective memory, working memory, attention, mental math, memory palace.
- Honest progress: baseline test on day 1, identical retest every 7 days, "Day 1 vs now" per skill; per-drill level, accuracy, speed, history; streak.
- Data never lost silently: export/import backup, backup nag after 7 days.

## 4. Non-goals (v1)

- Accounts, server, sync, multiple users, mobile app, installable/PWA.
- AI/ML of any kind ("evolves day by day" = adaptive difficulty + spaced scheduling).
- Face-emotion / cold-reading drill (needs a licensed face-photo set).
- Sleight-of-hand / conjuring (a hands skill; a screen can't train it).
- N-back (no lasting gains in Dresler 2017).

## 5. Anti-goals (failure even if it "works")

- Points, badges or praise that rise without measured improvement.
- Losing the user's history.
- Claiming gains the benchmark doesn't show.

## 6. Constraints

- One user, one Windows PC, Chrome/Edge. Everything local.
- Node 22 and Python 3.12 are installed. No npm runtime dependencies.

## 7. Approaches

| | Approach | Trade-off | Verdict |
|---|---|---|---|
| A | Plain HTML + JS (ES modules), no deps, browser storage, Node built-in test runner | Hand-built screens; zero install, nothing to update | **Chosen** (user delegated the choice: "most efficient and powerful") |
| B | Vite + React + TypeScript | Structure, types, libraries; ~200 MB deps + build step for a 1-user local app | Rejected: same outcome for the user, more upkeep |
| — | Electron/Tauri desktop app; AI-driven difficulty | Heavy / unverifiable | Ruled out |

## 8. Design

### 8.1 Running it
- `start.bat` starts a local server on a **fixed port 8742**, bound to `127.0.0.1` (not exposed to the network), and opens the browser.
  - Port must never change: browser storage is per origin, so a different port = "empty" app.
  - Server: Python `http.server`, with `.js` forced to `text/javascript` (Windows registry can map `.js` to `text/plain`, which breaks ES modules).

### 8.2 Storage
- One JSON document in `localStorage` key `hivemind:v1`: `{version, settings, cards[], drills{id:{level, history[]}}, sessions[], benchmarks[], lastBackupAt}`.
- History stores one summary per drill per session (accuracy, avg response ms, level), not every trial.
- Person photos are downscaled to 96×96 JPEG on upload (~4 KB each).
- Call `navigator.storage.persist()` on first run.
- A failed save (quota) shows an error and leaves the previous saved state intact.
- **Export** downloads the full JSON. **Import** validates `version` and shape before replacing anything; invalid files are rejected with a message.
- Dashboard nags when `lastBackupAt` is older than 7 days.

### 8.3 Daily session (fixed order, ~45–50 min)
1. **Remember-to-do cue** set: "When you see 🟣, click it." It appears once, unannounced, in a corner during a later drill for 5 s; scored hit/miss. (Click, not a key: keys collide with typed answers.)
2. **Reviews** — due cards (people, facts, reading, psych deck), capped at 100 per day; the rest carry over so a missed week can't balloon the session.
3. **Mental math** — 5 min timed arithmetic.
4. **Kim's game** — grid of objects shown briefly, then pick them out of a larger grid (shown + equal number of distractors); score = hits − false picks.
5. **What changed?** — scene shown, blank, scene again with one change; click it.
6. **Where was it?** — objects placed in a room grid, distraction, put them back.
7. **Digit span** — forward and backward.
8. **Cups tracking** — follow N marked cups while they shuffle.
9. **Memory palace** — word list placed on the user's own loci, recall in order.

- Can pause; cannot skip or reorder. Quitting = day incomplete, streak breaks.
- After completion: optional "extra rounds" of any drill.
- Day boundary is 4:00 local time (late-night sessions count for that day).

### 8.4 Adaptive difficulty (all generic drills)
- Weighted up/down staircase (Kaernbach 1991): level is a number; correct → +0.15, wrong → −0.85. Equilibrium accuracy = 0.85.
- Integer part of the level maps to that drill's parameters (items, exposure time, speed, targets). Level persists across days.

### 8.5 Spaced repetition (own material)
- SM-2 scheduler (Again / Hard / Good / Easy).
- Card types:
  - **Person**: photo (optional) + name + one detail. Prompt shows photo/detail; recall name.
  - **Fact**: question → answer.
  - **Reading**: user pastes text. App times the read (words/min), hides it, user types everything they recall, then sees original side by side and self-grades. Reappears on SM-2 schedule.
  - **Psych insight**: built-in starter deck of ~30 thinking biases and behaviour tells.
- Cards can be added/edited any time from a Library screen.

### 8.6 Weekly benchmark (~8 min, fixed difficulty, never adapts)
- Digit span max, math problems/min at a fixed difficulty, Kim's game recall (12 items / 10 s), change-detection accuracy, 20-word list recall after 2 min, tracking accuracy with 4 targets.
- Taken on day 1, then every 7 days in place of the first part of that day's session.
- Dashboard shows Day 1 vs latest per test, and a line per test over time.

### 8.7 Screens
```
┌ HiveMind ─────────────────────────────── 🔥 12-day streak ┐
│ [ Start today's session (≈47 min) ]   Due cards: 38       │
│                                                            │
│ Benchmark  Day 1 → now      Drill levels (7-day trend)     │
│ Digit span   6 → 8  ▁▃▅▇    Kim's game   L5 ▁▂▄▅           │
│ Words/20     7 → 13 ▁▄▆▇    What changed L4 ▂▃▃▅           │
│ Math /min    9 → 16 ▂▄▅▇    Cups         L3 ▁▁▂▃           │
│                                                            │
│ Library · Memory palace setup · Backup (last: 3 days ago)  │
└────────────────────────────────────────────────────────────┘
```
- First run: short intro → memory-palace setup (user names 10–20 places along a route in their home) → baseline benchmark.

### 8.8 Content shipped with the app
- ~300 concrete nouns (word lists), an emoji object set (Kim's game, Where was it), the psych starter deck.

### 8.9 Files
```
index.html  start.bat
css/style.css
js/app.js            screens + routing
js/store.js          load/save/export/import + validation
js/srs.js            SM-2
js/staircase.js      weighted up/down
js/session.js        daily sequence, cue, streak, day boundary
js/drills/*.js       each: run(container, level) → Promise<{correct,total,ms}>
js/data/*.js         words, objects, psych deck
test/*.test.js       node --test: srs, staircase, store import validation, day boundary
```

### 8.10 Accessibility
- Fully keyboard operable; visible focus; readable contrast.
- `prefers-reduced-motion` respected for decorative motion. Timed exposure in drills stays (the timing is the exercise).

## 9. Left to the builder
- Exact level→parameter tables per drill, visual style and animation, copy, chart drawing (inline SVG).

## 10. Calls made by the designer (not discussed with the user)
- Fixed port 8742; server bound to localhost.
- 4:00 day boundary.
- SM-2 rather than a newer scheduler (FSRS): simpler; upgrade later if review load feels wrong.
- Weekly benchmark replaces the start of that day's session rather than adding to it.
- Reading cards include a words-per-minute timer (covers "quick understanding").
- Psych insight delivered as flashcards, not a drill.
- Remember-to-do cue answered by click, not key press.
- Reviews capped at 100/day.
- Kim's game scored by picking from a grid (recognition), since emoji are hard to name by typing.
