"""Pure calculations and quote-quality gates, independent of any odds provider.

All consensus probabilities are market estimates. Neither a positive calculation
nor passing the quote checks establishes a profitable betting system.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from math import isfinite
from statistics import median
from types import MappingProxyType
from typing import Mapping


def number(value: float, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value):
        raise ValueError(f"{label} must be a finite number")
    return float(value)


def probability(value: float) -> float:
    value = number(value, "probability")
    if not 0 <= value <= 1:
        raise ValueError("probability must be between zero and one")
    return value


def decimal_price(value: float) -> float:
    value = number(value, "decimal odds")
    if value <= 1:
        raise ValueError("decimal odds must exceed one")
    return value


def american_to_decimal(odds: float) -> float:
    odds = number(odds, "American odds")
    if abs(odds) < 100:
        raise ValueError("use standard American odds of +100 or higher, or -100 or lower")
    return 1 + (odds / 100 if odds > 0 else 100 / abs(odds))


def expected_roi(p_win: float, price: float, p_push: float = 0.0,
                 commission: float = 0.0) -> float:
    """Commission is a fraction of net winnings on this isolated bet.

    Exchange commission on aggregate market winnings requires a portfolio model.
    """
    p_win, p_push = probability(p_win), probability(p_push)
    price, commission = decimal_price(price), probability(commission)
    if p_win + p_push > 1 + 1e-12:
        raise ValueError("win and push probabilities cannot exceed one")
    return p_win * (price - 1) * (1 - commission) - (1 - p_win - p_push)


def minimum_price(p_win: float, minimum_roi: float = 0.0,
                  p_push: float = 0.0, commission: float = 0.0) -> float:
    p_win, p_push = probability(p_win), probability(p_push)
    minimum_roi, commission = number(minimum_roi, "minimum ROI"), probability(commission)
    if minimum_roi < 0 or p_win == 0 or commission == 1 or p_win + p_push > 1:
        raise ValueError("a finite target requires positive win probability and valid terms")
    return 1 + (minimum_roi + 1 - p_win - p_push) / (p_win * (1 - commission))


def fair_probabilities(prices: Mapping[str, float], method: str = "proportional") -> dict[str, float]:
    """Caller must supply every exhaustive, mutually exclusive outcome.

    For pushable markets these prices alone only identify conditional values;
    the scanner consequently rejects pushable contracts.
    """
    if len(prices) < 2:
        raise ValueError("a complete market needs at least two outcomes")
    if any(not isinstance(key, str) or not key for key in prices):
        raise ValueError("outcomes need nonempty names")
    raw = {key: 1 / decimal_price(price) for key, price in prices.items()}
    total = sum(raw.values())
    if method == "proportional":
        result = {key: q / total for key, q in raw.items()}
    elif method == "additive":
        result = {key: q - (total - 1) / len(raw) for key, q in raw.items()}
        if any(p < 0 or p > 1 for p in result.values()):
            raise ValueError("additive de-vig produces invalid probabilities")
    elif method == "power":
        lo, hi = 0.0, 1.0
        while sum(q ** hi for q in raw.values()) > 1:
            hi *= 2
        for _ in range(100):
            mid = (lo + hi) / 2
            if sum(q ** mid for q in raw.values()) > 1:
                lo = mid
            else:
                hi = mid
        result = {key: q ** ((lo + hi) / 2) for key, q in raw.items()}
    else:
        raise ValueError("unknown de-vig method")
    return result


def kelly_fraction(p_win: float, price: float, multiplier: float = 0.25) -> float:
    """No-push, isolated-bet formula, not a personalised stake recommendation."""
    multiplier = probability(multiplier)
    return multiplier * max(0.0, expected_roi(p_win, price) / (price - 1))


def scenario_probability(scenarios: list[tuple[float, float]]) -> float:
    """Mix externally estimated (scenario weight, win probability) pairs.

    Does not infer injury probabilities or player impact from text.
    """
    if not scenarios or abs(sum(probability(w) for w, _ in scenarios) - 1) > 1e-9:
        raise ValueError("scenario weights must sum to one")
    return sum(probability(w) * probability(p) for w, p in scenarios)


def arbitrage_allocation(prices: Mapping[str, float], total_stake: float) -> dict:
    """Pre-fee theoretical allocation for an exhaustive no-push outcome set.

    The caller is responsible for identity, matching rules, limits and acceptance.
    This helper does not allocate rounded currency or promise executable profit.
    """
    total_stake = number(total_stake, "total stake")
    if total_stake <= 0 or len(prices) < 2:
        raise ValueError("positive stake and complete outcome prices required")
    implied = {key: 1 / decimal_price(price) for key, price in prices.items()}
    hold = sum(implied.values())
    return {"theoretical_arbitrage": hold < 1 - 1e-12,
            "stakes": {key: total_stake * q / hold for key, q in implied.items()},
            "profit_before_fees_and_rounding": total_stake * (1 / hold - 1)}


def aware(value: datetime) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("timestamps must include a timezone")
    return value


@dataclass(frozen=True)
class Contract:
    league: str
    event_id: str
    market: str
    subject_id: str
    line: str
    period: str
    rules_id: str
    outcomes: tuple[str, ...]
    start_at: datetime
    has_push: bool = False

    def __post_init__(self):
        aware(self.start_at)
        if not isinstance(self.has_push, bool) or not isinstance(self.outcomes, tuple):
            raise ValueError("push flag must be boolean and outcomes an immutable tuple")
        if any(not isinstance(v, str) or not v.strip() for v in
               (self.league, self.event_id, self.market, self.subject_id,
                self.line, self.period, self.rules_id)):
            raise ValueError("all contract identity fields must be explicit")
        if len(self.outcomes) < 2 or len(set(self.outcomes)) != len(self.outcomes):
            raise ValueError("outcomes must be distinct and complete")
        if any(not isinstance(o, str) or not o for o in self.outcomes):
            raise ValueError("outcomes must have nonempty names")


@dataclass(frozen=True)
class Quote:
    contract: Contract
    book: str
    family: str
    jurisdiction: str
    prices: Mapping[str, float]
    confirmed_at: datetime
    received_at: datetime
    mode: str = "manual"  # manual, replay, or live; not an authenticity guarantee
    suspended: bool = False

    def __post_init__(self):
        aware(self.confirmed_at)
        aware(self.received_at)
        if not all(isinstance(s, str) and s.strip() for s in
                   (self.book, self.family, self.jurisdiction)):
            raise ValueError("book, feed family and jurisdiction must be explicit")
        if self.mode not in {"manual", "replay", "live"}:
            raise ValueError("quote mode must be manual, replay, or live")
        if self.confirmed_at > self.received_at:
            raise ValueError("confirmation cannot follow receipt")
        if set(self.prices) != set(self.contract.outcomes):
            raise ValueError("quote must contain the exact complete outcome set")
        for price in self.prices.values():
            decimal_price(price)
        # Preserve an immutable snapshot even if the caller later mutates its input.
        object.__setattr__(self, "prices", MappingProxyType(dict(self.prices)))


@dataclass(frozen=True)
class Policy:
    jurisdiction: str = "CA-ON"
    max_age_seconds: float = 60
    min_reference_families: int = 3
    min_ev: float = 0.02
    max_probability_spread: float = 0.08

    def __post_init__(self):
        if not self.jurisdiction:
            raise ValueError("jurisdiction required")
        if number(self.max_age_seconds, "maximum age") <= 0:
            raise ValueError("maximum age must be positive")
        if isinstance(self.min_reference_families, bool) or not isinstance(self.min_reference_families, int) or self.min_reference_families < 2:
            raise ValueError("at least two reference families required")
        if number(self.min_ev, "minimum EV") < 0:
            raise ValueError("minimum EV cannot be negative")
        probability(self.max_probability_spread)


@dataclass
class Evaluation:
    decision: str
    data_mode: str
    reasons: list[str] = field(default_factory=list)
    reference_probabilities: list[dict] = field(default_factory=list)
    central_probability: float | None = None
    stress_probability: float | None = None
    central_ev: float | None = None
    stress_ev: float | None = None
    minimum_decimal_price: float | None = None
    notes: str = "Research output; no independently established edge or accepted wager."


def evaluate(candidate: Quote, outcome: str, references: list[Quote], now: datetime,
             policy: Policy = Policy(), material_news_at: datetime | None = None) -> Evaluation:
    """Fail closed on contract mismatches, stale data and insufficient evidence.

    Freshness uses last confirmed availability, not last price-change time.
    Reference regions can differ; candidate region must match the user's policy.
    Known book/feed families must be supplied externally; we cannot discover them.
    """
    aware(now)
    if material_news_at is not None:
        aware(material_news_at)
        if material_news_at > now:
            raise ValueError("news timestamp cannot be in the future")
    if outcome not in candidate.contract.outcomes:
        raise ValueError("outcome not in contract")
    result = Evaluation("INSUFFICIENT_DATA", candidate.mode)

    def invalid(quote: Quote) -> str | None:
        if quote.suspended:
            return "suspended"
        if quote.received_at > now or quote.confirmed_at > now:
            return "future_timestamp"
        if (now - quote.confirmed_at).total_seconds() > policy.max_age_seconds:
            return "stale_confirmation"
        if material_news_at is not None and quote.confirmed_at < material_news_at:
            return "predates_material_news"
        return None

    candidate_error = invalid(candidate)
    if candidate_error:
        result.reasons.append("candidate:" + candidate_error)
        return result
    if now >= candidate.contract.start_at:
        result.reasons.append("pregame_only:event_started")
        return result
    if candidate.jurisdiction != policy.jurisdiction:
        result.reasons.append("candidate:wrong_jurisdiction")
        return result
    if candidate.contract.has_push:
        result.reasons.append("push_probability_model_required")
        return result

    families: dict[str, Quote] = {}
    for ref in references:
        reason = None
        if ref.contract != candidate.contract:
            reason = "different_contract"
        elif ref.book == candidate.book or ref.family == candidate.family:
            reason = "candidate_self_reference"
        elif ref.mode != candidate.mode:
            reason = "different_data_mode"
        else:
            reason = invalid(ref)
        if reason:
            result.reasons.append(f"reference:{ref.book}:{reason}")
            continue
        if ref.family not in families or ref.confirmed_at > families[ref.family].confirmed_at:
            families[ref.family] = ref
    if len(families) < policy.min_reference_families:
        result.reasons.append("insufficient_distinct_reference_families")
        return result

    estimates = []
    central = []
    for family, ref in sorted(families.items()):
        row = {"book": ref.book, "family": family,
               "confirmed_at": ref.confirmed_at.isoformat(), "methods": {}}
        for method in ("proportional", "additive", "power"):
            try:
                p = fair_probabilities(ref.prices, method)[outcome]
            except ValueError:
                result.reasons.append(f"reference:{ref.book}:invalid_{method}")
                return result
            row["methods"][method] = p
            estimates.append(p)
            if method == "proportional":
                central.append(p)
        result.reference_probabilities.append(row)
    result.central_probability = median(central)
    result.stress_probability = min(estimates)
    price = candidate.prices[outcome]
    result.central_ev = expected_roi(result.central_probability, price)
    result.stress_ev = expected_roi(result.stress_probability, price)
    result.minimum_decimal_price = minimum_price(result.stress_probability, policy.min_ev)
    if max(estimates) - min(estimates) > policy.max_probability_spread:
        result.reasons.append("reference_or_method_disagreement")
        return result
    # Require the explicit error margin even under the stress calculation.
    if result.stress_ev < policy.min_ev:
        result.decision = "PASS"
        result.reasons.append("stress_value_below_policy_margin")
    else:
        result.decision = {"replay": "HYPOTHETICAL_CANDIDATE",
                           "manual": "MANUAL_CANDIDATE",
                           "live": "CANDIDATE_REQUIRING_PRICE_CONFIRMATION"}[candidate.mode]
    return result
