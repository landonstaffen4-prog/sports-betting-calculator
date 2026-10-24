# Six-bettor research and calculator design
Research date: 24 October 2026. Version 0.1.

## Main conclusion
Build a market-value engine and a separate forecasting research layer. These bettors do not share one interchangeable formula. Public content supports reusable processes, but does not expose every private model, parameter, data source or bet.

This review covers Right Angle Sports/Edward Golden, Hitman, Alex Monahan, ClevTA, Dr. Bob/Bob Stoll and Hugh Taylor. It is a substantial public-source review, not an exhaustive viewing of all their videos or an independent verification of their lifetime earnings.

The source register is [sources.json](sources.json). IDs below refer to that register. First-person interviews are evidence of what a speaker described, not proof that the claimed edge exists. Public service records are not automatically an audited, realistically executable history.

## What each source contributes
| Source | Publicly described emphasis | Useful software feature | What we cannot claim |
|---|---|---|---|
| RAS | Team research, ratings, market interpretation | Ratings/version records, move-origin and liquidity context | A replica of its current proprietary model |
| Hitman | NFL specialization, lineup information, price-sensitive execution | Availability scenarios, news timestamps, exact-price gates | Access to his complete private projections |
| Monahan | Comparing market prices to estimated fair value | De-vig, benchmark comparison, stale-price screening | A known true probability from bookmaker odds |
| ClevTA | Matchups, efficiency and regression research | Opponent/context features and chronological testing | Every historical pattern remains profitable |
| Dr. Bob | Independent statistical forecasts and player adjustments | Predictive models, priors and lineup-aware simulations | Public essays reveal his fitted coefficients |
| Hugh Taylor | Racing form, replays, context and independent valuation | Structured observations and value-versus-price analysis | Horse-racing factors transfer directly to NBA props |

### 1. Right Angle Sports / Edward Golden
RAS describes a team of originators supported by researchers and modelers, with public grading rules. This is a research operation rather than a universal picking rule. [RAS1]

A particularly useful 2022 interview is with RAS member **Michael Craig**, not Edward Golden. Craig describes comparing multiple ratings, including market and efficiency information, then researching offseason changes. His own priors give way to current-season information after roughly five games. That timing is a historical personal description, not a hardcoded rule for our system or every RAS originator. [RAS2]

A 2025 RAS article says a move's interpretation depends on its originating book, limits, patterns, news and timing. It explicitly acknowledges that market movement cannot identify sharp action with certainty. [RAS3]

**Our implementation:** store a sequence of actual observed quote changes and associated news. Display origin and available limits if known. A move can flag research, but never becomes an automatic “sharp money” probability boost.

### 2. Hitman
His official service distinguishes regular-season sides/totals, props and preseason markets. It describes differing liquidity and warns that releases can move within seconds. [HIT1]

In an accessible 2026 interview excerpt, he connects preseason opportunities with uncertain lineups, anticipating or reacting to information, and exact-line sensitivity. The transcript is hosted by a third party and only an excerpt was accessible; it is not a complete review of the show. [HIT4]

Another excerpt discusses an uncertain receiver return affecting other pass catchers' prices. That illustrates conditional outcomes rather than treating “questionable” as “out.” Some speaker boundaries are imperfect, so this supports a scenario-design lesson rather than a claim about his private numerical inputs. [HIT5]

**Our implementation:** represent availability and playing-time scenarios explicitly, preserve their evidence timestamps, and calculate weighted outcomes only when scenario weights and impact estimates are supplied by a defensible model. Natural-language reports do not spontaneously become precise probabilities.

### 3. Alex Monahan
His examples support a market-comparison workflow using an odds screen and a positive-EV tool. Price and contract terms are central. [MON1, MON2]

**Our implementation:** retain all source prices, remove margin using transparent methods, exclude the candidate's own feed from its benchmark, and stress-test estimates. This builds on the prior Monahan protocol, without importing its promotional return claims.

### 4. ClevTA / ClevAnalytics
A public methodology coauthored with Chase examines fourth-quarter win expectations, looks for teams that over- or underperformed, and describes evaluating the process one year at a time. It also discloses using assumed +180 alternative-line prices because historical prices were unavailable. Those results therefore cannot be treated as fully executable historical returns. [CLE1]

A separate public matchup write-up considers opponent-adjusted efficiency, pressure, coverage and personnel usage. It shows the breadth of context, not a disclosed formula mapping each factor to win probability. [CLE2]

His record page distinguishes contest selections from wagering returns. These should remain distinct in our database. [CLE3]

**Our implementation:** chronology-aware features, regression diagnostics and explicit labels for actual versus assumed historical prices. A trend is a hypothesis to test, not a ready-made wager.

### 5. Dr. Bob / Bob Stoll
His model essay distinguishes explaining past results from predicting future ones and describes adjusting statistics for opponent quality. [BOB1]

His college-basketball description includes preseason program/coach/player priors, estimated player contributions and playing time, followed by season updates. It describes a four-season holdout and subsequent live use. Those are service-published claims; the underlying training data and code were not independently reproduced here. One retrieved season-row loss count appears inconsistent with the aggregate, so it should not be silently corrected and used as verified data. [BOB3]

He describes situational analysis as an overlay that can keep him off model selections, while noting that some patterns lose usefulness as markets adapt. [BOB2]

His staking introduction discusses time horizon, simultaneous bets and fractional sizing. [BOB4]

**Our implementation:** a separate independent forecast with documented priors, opponent adjustment, player impact and uncertainty. Keep overlays testable. Do not invent numerical advantages from an analyst's narrative.

### 6. Hugh Taylor
A historical first-person interview describes assessing and pricing races before seeing forecasts, using replay observations and context such as pace and track bias. That is an independent-valuation process and differs from anchoring directly to sportsbook consensus. It also describes coping with long losing runs at longer odds. This interview dates to 2011, so it is a historical method account rather than proof of his exact current routine. [HUGH1]

His publisher explains that the column's quoted prices are checked at publication, may disappear quickly, and produce lower returns if readers take shorter prices. [HUGH2]

His FAQ distinguishes advised-price performance from starting-price performance. This is a particularly useful reminder to evaluate a strategy at the price the user can obtain. [HUGH3]

**Our implementation:** preserve independent model output before showing market prices when testing anchoring effects. For racing, use a separate adapter for runner fields, going, draw, non-runners and settlement rules; none of those factors should be transplanted into basketball.

## The disagreements are useful
Monahan's market-based approach and Dr. Bob's independent forecasting are different sources of evidence. Hugh's independent-pricing workflow offers another contrast. Their existence does not prove either is universally superior.

We should record **market fair probability**, **independent forecast probability** and **combined probability**, when justified, as separate values. We should not average six bettors' picks, treat repeated social posts as independent evidence, or apply six additive adjustments to the same injury.

An independent forecast only earns a role in a combined estimate after chronological validation against a market baseline. If it has no demonstrated incremental value, its output stays a research view. Choosing combination weights from reputation is not validation.

## Records and credibility: what was actually verified
| Source | Accessible evidence | Remaining verification gap |
|---|---|---|
| RAS | Official record pages and third-party tracker link | Complete tracker ledger not extractable; archive filter/rendering issues |
| Hitman | Official multi-year breakdown and tracker/sheet links | External sheet/ledger not extracted; historical unit scales vary |
| Monahan | Prior first-person examples and tracking references | No independent complete lifetime profit audit |
| ClevTA | Official contest/wagering distinctions and linked record | Linked independent ledger not reproduced |
| Dr. Bob | Official method descriptions, reported historical tests and results | Original data/code absent; apparent table transcription issue |
| Hugh Taylor | Publisher's column, historical results links and pricing explanation | Complete accepted-price ledger not reconstructed |

This table does not rank the six by independently verified profitability.

RAS's retrieved archive had a date-filter display inconsistent with the URL's requested start date and placeholder-like pending rows. Pending text was excluded from any performance inference. This is a retrieval/rendering limitation, not a finding of misconduct. [RAS4]

Hitman's official page shows a losing prop segment in one year alongside other profitable segments, illustrating why per-market results matter. It also uses different unit conventions across categories and years. A combined hit rate alone would conceal that. [HIT2]

No headline win rate is promoted to an estimated probability for the next bet. We need odds, timestamps, stake conventions, fees and complete coverage. A strong record at a release price does not establish that delayed followers retain the edge.

## Calculator architecture derived from the research
1. **Ingest and normalise:** odds, full contract terms, region, event IDs, player IDs and timestamps.
2. **Check usability:** suspended/started events, exact matching lines/rules, freshness, availability and news timing.
3. **Estimate market value:** several de-vig methods, benchmark grouping and disagreement diagnostics.
4. **Research game conditions:** independent predictive models and scenario-based player adjustments.
5. **Evaluate decision:** expected return at the actual offer, conservative scenarios and a minimum acceptable price.
6. **Record outcome:** price requested, price accepted, rejected fills, final result, closing value and model version.
7. **Validate:** chronological holdouts, calibration, net returns and realistic execution.

These are our design decisions based on the research, not a claim that any individual implements this exact architecture.

## What to implement first
The included Python foundation implements transparent arithmetic and quote-quality checks. It uses synthetic/manual JSON snapshots rather than paid feeds.

The first usable product should support **pregame NBA singles** with:
- a coverage table listing exactly which Ontario books/markets are connected;
- offered odds, central and stress fair estimates;
- source confirmation times and reasons for excluding references;
- minimum acceptable odds and a pass/insufficient-data result;
- manually entered scenarios before automatic news interpretation;
- a persistent record of paper decisions and actual accepted prices.

NFL and college-sports modules follow when their data and validation are available. Horse racing is a distinct modelling and settlement project.

## Data-source findings
The Odds API currently documents a Canadian region with several Ontario-specific book IDs. Its market guide says props are primarily covered for US sportsbooks and additional markets update at one-minute intervals. Ontario main-market coverage does not establish equivalent Ontario prop coverage. [API1, API2]

Its historical documentation describes five-minute snapshots for much of the available history and paid access. This can support broad historical research, but cannot prove that a price available for five seconds was fillable. [API3]

OpticOdds documents a separate last-polled timestamp from last price change. This distinction directly informed our freshness design. [API4]

OpticOdds also documents streaming and a historical endpoint with rolling two-month retention. A long-term archive, time-series permissions and precise Ontario market coverage need confirmation before purchase. [API5, API6, API7]

No paid service was selected or purchased. No API key was requested or embedded. No provider currently feeds this prototype. A public list of supported books is a discovery source; real coverage must be tested against the intended subscription and region.

## Research limitations
- X pages were largely blocked; YouTube channel fetches returned little more than page shells.
- No claim is made to have watched every video or stream.
- Public interview transcripts and public articles were used where accessible.
- Some newer transcripts were excerpts with sign-in links for more; no access restriction was bypassed.
- Paid picks, proprietary formulas and private source datasets were not obtained.
- The research identifies engineering requirements; it does not establish the profitability of the included prototype.
- Source dates are recorded separately from access date. A currently accessible page may contain old methods or updated material.

## Build status
Included now: a provider-independent calculation engine, a JSON CLI, an invented NBA example and 26 unit tests.

Not included: live sportsbook integration, trained forecasts, automatic news parsing, a web interface, accepted-bet reconciliation, parlay probability models or deployment. These require further work and, for live odds, an appropriate data feed.

## Reading the source register
Every entry in sources.json includes the title, URL, source type, access date and scope. It intentionally contains short original notes rather than copied articles or complete transcripts. The accompanying specification maps the findings into explicit requirements and acceptance checks.

