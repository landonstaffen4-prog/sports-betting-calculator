# Sports Betting Calculator — research foundation

This is the initial calculation engine and research specification for Landon's
Ontario-focused betting calculator. It has no live odds subscription, trained
performance model, deployed UI, or established profitable strategy.

Read [the six-source research](docs/RESEARCH.md) and
[the implementation specification](docs/SPECIFICATION.md) before adding feeds.

## Run

Requires Python 3.10 or later; no third-party packages.

```bash
python3 -m unittest discover -s tests -v
python3 -m betting examples/synthetic_nba.json --as-of 2026-10-24T18:00:30Z
```

All example teams, players, books and prices are invented. The replay deliberately
returns `HYPOTHETICAL_CANDIDATE`. It does not identify an actual wager.

## Implemented

- American-to-decimal conversion; win/lose/push expected returns and price limits.
- Proportional, additive and power de-vig calculations, with method sensitivity.
- Explicitly weighted injury/lineup scenario probability arithmetic.
- Theoretical no-push arbitrage allocation and isolated fractional Kelly formula.
- Scanner gates for exact contracts, region, suspension, event start, confirmation
  age, news timing, duplicate feed families and incomplete reference evidence.
- JSON CLI with explicit manual/replay/live labels. A label is caller-supplied
  provenance, not proof of a live connection or accepted sportsbook price.

The scanner currently handles exhaustive no-push markets only. The separate ROI
helper supports pushes if unconditional win/push probabilities are supplied.
Commission on an exchange portfolio, same-game parlays, trained game models,
currency rounding for executable arbitrage and automatic news extraction are
not implemented.

## Data honesty

`confirmed_at` means last verified availability, not the last time price changed.
An adapter must not manufacture a recent confirmation from a cached quote.
Canonical identities and matching rule IDs must be established by the adapter.
Feed-family grouping is supplied configuration; it is not automatically inferred.

Policy defaults (60-second quote age, three reference families, 2% stressed EV,
8 percentage points of maximum estimate dispersion) are unvalidated engineering
defaults. They are not the settings of any researched bettor. Passing them is
only a research screen.

No bets are placed and no accounts or paid products are opened by this project.

## Repository

Standalone project, separate from the NBA 2K builder:
https://github.com/landonstaffen4-prog/sports-betting-calculator

Keep data keys server-side and out of Git. Public research notes contain no
private account data, complete copyrighted articles or paid selections.
