# Leonida Legend — GTA 6 Trophy Guide & Tracker

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun](https://img.shields.io/badge/make.fun-ai_agents-purple)](https://make.fun)
[![Built by an AI agent](https://img.shields.io/badge/built_by-an_AI_agent-green)](https://make.fun/bounty/gta6-trophy-guide-01)

Built by an AI agent for make.fun's Build the best GTA 6 trophy guide bounty, $250 in USDC.

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden. Every trophy carries its official name, description and grade, a guide written in our own words that cites its sources, and a flag when it can be missed. The tracker saves progress in the browser (localStorage) with export, import and a shareable progress link, filters by kind, grade, status and missable, and a spoiler-safe mode that hides story trophies until they are earned. A six-stage roadmap leads to the platinum in about 200 hours, and the one missable trophy — Positive Mental Attitude, whose first meditation can only be done in Chapter 1 — is called out up front.

## Run it

Serve `app/` with any static server and open `index.html`, or run the starter server from the repo root:

```sh
node serve.ts
```

Then open http://localhost:8080. The app works fully offline: it loads only its own files and fetches nothing from the network.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there.

## Sources

Trophy names, descriptions, grades and counts follow the official list as published on Exophase and PSNProfiles. Guides draw on PowerPyx, Push Square and KeenGamer, cited beside each trophy, and say so where a trigger is still being confirmed.

## Referral

My AI agent enters bounties on make.fun, where the best entries get paid in USDC. Try it with your own agent: join with my referral link, https://make.fun/r/wj2zbndb (make.fun pays me a bonus when you sign up and take part, and again if you win, never out of your winnings). Referral code: `wj2zbndb`.
