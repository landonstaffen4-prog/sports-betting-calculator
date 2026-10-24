# Implementation specification
Version 0.1 — 24 October 2026.

## Product goal
Help Landon compare eligible Ontario sportsbook offers with defensible probability estimates and identify candidates worth reviewing. The app must distinguish measured data, estimates, manual inputs and missing information.

A “candidate” is a research screen, not an accepted bet or a guaranteed edge. “Best” always names the set of sports, events, markets and books actually scanned.

## Deliverable boundaries
The initial Python implementation is a working calculation core and replay CLI. It is not an all-sports live scanner, forecasting service or deployed website.

No bookmaker account operations are implemented. No keys, bank information, private messages or unrelated personal context belong in this repository.

## Design requirements
### Contract identity
A canonical contract must specify sport/league, event, subject, statistic, numeric threshold or explicit non-threshold value, period, overtime treatment, player participation/void rules, tie/dead-heat treatment and outcome set.

The prototype carries an explicit rules_id rather than parsing every bookmaker rule. A production adapter must create that ID from verified rules, not assume two books match. Totals, spreads and alternate lines cannot be matched by loose text.

An NBA player over 24.5 is not over 25.5. A regulation-only soccer outcome is not a qualification market. A book-specific injury-protection offer changes settlement economics.

### Source provenance
Store provider, provider record ID, original book ID, regional product, feed/book family, last price-change time, last confirmed availability, ingest time, suspended status and raw payload hash.

Record a heartbeat separately from a price change. Missing data is not evidence of an unchanged price. Reconnection must invalidate uncertain state until a full reconciliation succeeds.

Prototype Quote.confirmed_at and received_at are mandatory aware timestamps. Family assignment is explicit configuration and must not imply verified independence when relationships are unknown.

### Benchmark selection
Never use the candidate book or its known shared feed in its own benchmark. Group related price sources before counting evidence.

The prototype keeps the freshest quote from each supplied family. The central estimate is the median proportional no-vig estimate. Its stress value is the lowest estimate across retained references and supported methods. These are transparent defaults, not statistically calibrated confidence bounds.

Future weights must be learned separately by sport, market, price range and liquidity/time bucket using only prior data. Avoid automatic blanket claims that one book is sharpest for every market.

### Forecasting
Independent models must be distinct from the market benchmark. Store forecast distribution, predictive interval, feature availability time, model version, training cutoff and calibration diagnostics.

NBA candidate inputs: projected possessions and minutes, roster availability, role/usage, shooting mix, opponent-adjusted efficiency, rest and travel. These are hypotheses until their incremental value is tested. Use distributions for props rather than comparing a mean to a threshold.

NFL candidate inputs: play-by-play efficiency, success rate, opponent adjustment, personnel, protection/pressure, neutral-situation tendencies, schedule and weather. Preseason requires explicit rotation/availability scenarios.

Horse-racing inputs and market rules require a separate design. An NBA architecture cannot price each-way or non-runner deductions without additional settlement logic.

### Injury and news scenarios
Every material update needs source URL, published_at, observed_at, affected participants and an evidence status. Distinguish confirmed announcements, attributed reports and speculation.

For mutually exclusive, exhaustive scenarios s:
p(win)=sum(weight_s × p(win|s)).
Weights must sum to one. The prototype calculates this mixture from supplied numbers; it does not estimate the numbers.

Record which model/market snapshot already incorporates the news. Do not add an injury effect twice by shifting both a market benchmark and a market-anchored forecast.

Prototype material_news_at is an externally flagged event; quotes older than it are excluded. This is a conservative reprice gate, not a complete news-understanding model.

### Decision gates
Reject or mark insufficient data when:
- the event has started in pregame mode;
- an offer is suspended, stale, dated in the future or unavailable in the selected region;
- contracts differ or complete outcome prices are absent;
- references lack sufficient distinct families;
- prices predate a flagged material update;
- forecasts disagree beyond the configured tolerance;
- unconditional probabilities needed for pushes are missing;
- the data are from mixed provenance modes.

Prototype defaults: quote confirmation age ≤60 seconds; ≥3 distinct reference families; stress EV ≥2%; estimate dispersion ≤8 percentage points. These values are engineering defaults, not learned or bettor-specific settings. They should be visible configuration, never hidden credibility scores.

A replay stays a replay even if its timestamp appears current. A manually entered offer remains manual. Live data still requires the user to confirm the actual accepted price.

### Arithmetic
Decimal d includes returned stake.
- No-push ROI: p × d − 1.
- With push: p_win × (d−1) − p_loss.
- Isolated-bet commission c on net winnings: p_win × (d−1) × (1−c) − p_loss.
- Minimum price for ROI e: 1 + (e+p_loss)/(p_win × (1−c)).
- Fractional Kelly for an isolated no-push contract: multiplier × max(0,(p×d−1)/(d−1)).
- Exhaustive no-push arbitrage: sum(1/d_i)<1 before fees; allocation proportional to 1/d_i.

A complete sportsbook outcome set is needed to remove margin. A pushable two-way market's normalised values generally identify probabilities conditional on no push. The scanner rejects pushable contracts until the unconditional distribution is supplied.

Parlays require joint probabilities and actual offered payout. Conditional injury effects create dependence. No multiplication of marginal probabilities without an explicit independence assumption.

Exchange commission can apply to net market winnings, not separately to each bet; the isolated-bet helper does not solve that portfolio problem.

Currency rounding, maximum stakes, fill rejection and void asymmetry must be evaluated before theoretical arbitrage is called executable. That execution layer is not implemented.

### Learning and evaluation
Keep immutable chronological snapshots. Train, tune and test on separate time ranges. Freeze transformations and strategy parameters before evaluating the final test.

Benchmarks:
1. No-vig reference-market estimate.
2. Simple league-specific baseline.
3. Independent forecast.
4. Any combined forecast.

Measure probability calibration, log loss, Brier score, eligible turnover, net ROI, drawdowns and closing value. Predictive accuracy alone cannot select the wagering policy. Report fees, tool costs, missing outcomes, rejected prices and unavailable odds.

For correlated sports slates, use game/day blocks for uncertainty estimation. Record the number of configurations tested; selecting a best backtest from thousands inflates apparent performance. Do not use future injury status, final lineups or closing odds as earlier-time features.

Historical prices that were assumed must be marked assumed and excluded from executable-ROI claims. Five-minute snapshots cannot establish five-second fillability.

Shadow mode should log every eligible decision, including passes, with actual price confirmation/availability where possible. No arbitrary sample count establishes profitability.

### Staking and portfolio exposure
No personalised dollar staking without an explicit discretionary bankroll and known open exposure. The core exposes Kelly arithmetic only.

Production risk controls need per-event, player, team and scenario concentration; correlated positions; pending balance; maximum drawdown policy and aggregate loss budget. A set of individually small bets can still concentrate on one injury scenario.

Avoid treating Kelly as a cure for uncertain probabilities. Default to paper decisions until the modelling and execution record can be evaluated.

## Proposed storage tables
| Table | Purpose |
|---|---|
| events | Canonical fixtures, status and schedule history |
| participants | Canonical team/player/runner IDs and aliases |
| contracts | Exact market and settlement identity |
| quotes | Append-only regional price/availability observations |
| source_health | Provider polling, heartbeat and outage state |
| news_events | Sourced information and publication/observation times |
| scenarios | Weighted availability/usage states and evidence |
| model_versions | Feature schema, training cutoff and frozen artefacts |
| forecasts | Probability distributions and calibration metadata |
| decisions | Candidate/pass reasons and reproducible input references |
| fills | User-confirmed accepted odds/stakes; separate from recommendations |
| settlements | Result, rule application, costs and net P/L |
| coverage | Which region/book/market combinations actually work |

These are implementation plans; the prototype does not create a database yet.

## API integration acceptance plan
1. Fetch actual supported and active books for the intended subscription.
2. Explicitly identify Ontario products; preserve informational international references separately.
3. Test NBA moneyline, spread, total and selected props on several fixtures.
4. Compare provider quotes with user-visible regional offers at recorded times.
5. Verify suspension/deletion handling, timestamp semantics and quota usage.
6. Replay outages and reconnections. Never continue showing old opportunities as live.
7. Confirm historical depth and rights before relying on it for long-term testing.
8. Keep provider credentials server-side via environment/secret management.

No provider is selected solely because its marketing headline says “100+ sportsbooks.”

## First interface
Future UI should show:
- clear Manual / Replay / Live data status;
- covered books, markets and observation times;
- exact bet terms and current offer;
- central and stress EV with source estimates;
- minimum acceptable odds;
- why it qualified or why it was rejected;
- game-condition evidence with uncertainty;
- separate independent-model and market estimates;
- paper tracking and accepted-price entry.

Keep API internals and model engineering jargon in diagnostics, not the primary user flow.

## Implementation roadmap
**Done:** pure calculation core; complete-contract data objects; deterministic replay CLI; synthetic example; 26 meaningful unit tests; source register and research.

**Next:** persistent snapshots and manual offer entry; provider adapter interface and conformance fixtures; confirmed Ontario coverage; official injury ingest; first UI.

**Then:** independent NBA modelling and chronological validation; portfolio-aware risk; conditional props and parlay pricing; additional sports.

**Before calling it live:** actual feed connected, regional quotes reconciled, unavailable markets handled, news timing tested and credentials protected.

**Before claiming an edge:** out-of-sample evidence and realistic execution/cost accounting. Researching successful bettors is not that evidence by itself.

