# Sports betting research assistant

This repository supports answers delivered directly in ChatGPT, like the NBA 2K builder. The user asks for bets here; the assistant researches accessible sportsbook prices and game conditions, performs calculations behind the scenes, and returns a concise, sourced shortlist or a pass. There is no user-facing app, website, subscription setup or required data key.

## Operating instructions

Read [AGENTS.md](AGENTS.md) and [the chat workflow](docs/CHAT_WORKFLOW.md) before answering a betting request. [Six-bettor research](docs/RESEARCH.md) and [the source register](docs/sources.json) record the public material actually examined. They do not reproduce proprietary models or establish profitable performance.

## Behind-the-scenes arithmetic

Python 3.10+, no dependencies:

```bash
python3 -m unittest discover -s tests -v
python3 -m betting examples/synthetic_nba.json --as-of 2026-10-24T18:00:30Z
```

The example is invented and historical. Never present its output as a real bet. The calculation engine supports odds conversion, expected return, push and commission inputs, margin removal, scenario arithmetic, exact-market checks and source freshness checks. It does not fetch live odds or provide a validated sports prediction model.

The retired website has been removed from the current source. Prior versions remain in Git history. Research notes contain only public sources; never commit credentials or private betting/account information.
