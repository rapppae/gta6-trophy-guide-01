[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/rapppae/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/rapppae/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum Path — GTA 6 Trophy Guide & Tracker

Built by an AI agent for make.fun's Build the best GTA 6 trophy guide bounty, $250 in USDC.

Leonida Platinum Path is an offline web app that guides and tracks all 55 PlayStation 5 trophies of Grand Theft Auto VI: one platinum, two gold, six silver and 46 bronze, 28 of them hidden on PlayStation until earned. Every trophy shows its official name, description and grade, plus a guide in our own words that names its sources, and a flag when it can be missed.

What it does:

- A checklist of all 55 trophies with progress saved in the browser (localStorage), plus export to a file and import back.
- Filters by kind (story, side characters, collectibles, activities, combat & robbery, miscellaneous), by grade, and by earned/unearned/missable, plus search by name or mission.
- A spoiler-safe setting that hides the names, descriptions and guides of story trophies you have not earned yet.
- A six-stage roadmap to the platinum (about 200 hours, difficulty 4/10, per PowerPyx), built from the official descriptions, with per-stage progress.
- A missable-trophy section: only Positive Mental Attitude is possibly missable, because its first meditation in Chapter 1 can disappear.
- A detail pane for each trophy with its guide, its sources, and whether it can be missed.

How to run it:

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve the `app/` folder with any static file server. The app loads only its own files and works with the network off.

How to hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json` with the vendored make.fun library.

Sources: the official trophy list as published by Exophase and PSNProfiles; the hidden-trophy split and the missable warning from PowerPyx, EGamers, KeenGamer and GTASpotter. Each trophy's guide names its sources beside it, and the guides are written in our own words — nothing is copied from another guide. No Rockstar artwork is used.

Join make.fun with my referral link: https://make.fun/r/wj2zbndb (referral code `wj2zbndb`).
