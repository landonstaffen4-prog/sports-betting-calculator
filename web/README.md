# Edge Lab

A private, zero-dependency odds research application. Manual calculator, scenario and joint-probability parlay math, an optional The Odds API adapter, and a device-local paper/actual bet journal.

## Use without paying

The manual calculator and journal need no API key. The demo is clearly synthetic. Optional current NBA/NFL/NHL/MLB main markets and NBA props require your own The Odds API key; select a free plan if offered. Enter it only into Data & limits, never source control or chat. Keys stay in tab memory. Requests happen only when you press Fetch, consume provider credits, and do not cover every sportsbook. No OpenAI API or paid subscription is required by the app.

## Run and test

Node 22 or later; no npm install needed.

```
npm run dev
npm run build
npm test
npm run validate
```

The build embeds static assets and the calculation engine into a Cloudflare Worker. Optional runtime `ODDS_API_KEY` is a secret. Hosted API odds requests require the authenticated identity supplied by Sites. Local development supplies a development identity.

## Interpret results

Prices are compared against paired reference markets using proportional, additive and power margin removal. Distinct configured families, timestamps, matching lines and price/method sensitivity are checked. Review candidates are estimates, not established true probabilities or verified profitable bets. Pushable markets are excluded from automatic evaluation. Injuries and rules require manual review. Thresholds are engineering defaults, not trained parameters. No automated wagering or stake recommendation.

Journal data is saved only in this browser/device. Export backups before clearing storage or changing devices. Drawdown follows recorded settlement times; imported older records without them fall back to creation time. Paper and actual ledgers are separate. The application does not have independently validated forecasting or profitability.
