# Chat-first betting research workflow

Version 1 — 24 October 2026. This replaces the website delivery plan. User interaction is a normal ChatGPT message; all tools and calculations are operated by the assistant.

## 1. Establish the slate
Resolve today in America/Toronto. Check the official league schedule, start times and whether games have started. Use pregame straight bets by default. Honour the requested sport, dates, books and bet types. Do not substitute yesterday's cached slate.

## 2. Collect prices
Search accessible first-party Ontario sportsbook pages for the slate, then open the relevant pages. Where needed and supported, inspect rendered public odds through browser tools. Do not bypass geolocation, sign-in walls, bot protections or paywalls. A search snippet or cache date is not confirmation of current availability. Cross-check accessible comparison pages as discovery aids, preserving the book and regional distinction.

Capture event, player, market, exact line, period, decimal/American price, book/product, settlement assumptions, source URL, observation time and any source update time. Mark freshness unknown if the source does not establish it. Never turn retrieval time into provider confirmation time. Compare matching contracts; +5.5 and +6.5 are different bets. Require paired outcomes for margin removal. Record inaccessible books as a coverage limitation instead of inventing their odds.

## 3. Research conditions
For NBA, prioritize the latest official injury report, official team/league lineup news, likely availability and minutes, rotation changes, rest/back-to-backs, opponent-adjusted performance and matchup context. Cite underlying sources; check dates and player/team identities. Early-season samples need appropriate prior context. A questionable tag does not mean 50% availability. Do not invent quantitative impacts or use unsupported recent-hit-rate arguments.

## 4. Apply the documented principles
- Monahan: comparison prices, margin removal, executable value and minimum odds.
- RAS: research the origin, timing and liquidity of moves; movement is not automatic proof of sharp action.
- Hitman: availability scenarios, market specialization and exact-price execution.
- ClevTA: opponent context, regression hypotheses and honest historical assumptions.
- Dr. Bob: predictive, opponent-adjusted information; distinguish a validated independent forecast from a narrative.
- Hugh Taylor: independent valuation and obtainable prices. Racing factors do not automatically transfer to NBA.

These are separately documented public principles. Do not claim to use their private models, to have watched all their content, or to know their current picks without checking them.

## 5. Calculate and challenge
Use the Python arithmetic helpers or explicit reproducible calculations. Remove reference margins with proportional, additive and power methods where applicable. Exclude the candidate price from its own benchmark and group known shared feeds. Stress the result across reference/method choices; correlated books do not count as independent models. Quote a market-implied estimate as such, never as a calibrated true win probability.

The existing scanner's 60-second age, three-family, 2% stressed EV and 8-point dispersion defaults are unvalidated engineering screens. Passing them is not proof of profitability. Do not relax failed gates to manufacture recommendations. If browsing cannot supply reliable timestamps, exact contracts or enough references, say so; an interesting price can be reported as an unverified watch item, not as an established positive-EV bet.

An independent forecast, precise edge or minimum price requires an explicit defensible probability basis. Otherwise give the price comparison and qualitative evidence without invented percentages. A high win rate or short winning streak alone does not demonstrate value. Check push/void rules, news sensitivity and whether the offered price changed.

## 6. Return the answer in ChatGPT
Use a short table or short bullets with selection and line, sportsbook and observed odds, minimum acceptable price when supported, rationale and main uncertainty. Cite prices and material news near the relevant statement. Disclose actual source timing/coverage limitations in one concise sentence. Do not force selections; "No sufficiently supported bet at the prices I could verify" is a valid outcome. Never automatically place bets or prescribe a dollar stake based on an unvalidated estimate. If asked about sizing, distinguish budgeting from a validated Kelly input.

## 7. Future maintenance
Refresh current facts on each request. Update this workflow when the user changes preferences. Retain publicly documented research without treating it as permanent current knowledge. Do not automatically store private betting history in the public repository. Do not require the user to manage files, a site, or API credentials to receive an answer.
