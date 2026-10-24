import math
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone

from betting.core import (Contract, Policy, Quote, american_to_decimal,
                          arbitrage_allocation, evaluate, expected_roi,
                          fair_probabilities, kelly_fraction, minimum_price,
                          scenario_probability)


class ArithmeticTests(unittest.TestCase):
    def test_odds_conversion(self):
        self.assertEqual(american_to_decimal(150), 2.5)
        self.assertAlmostEqual(american_to_decimal(-110), 1 + 100 / 110)
        for odds in (0, 50, math.nan, math.inf, True):
            with self.assertRaises(ValueError):
                american_to_decimal(odds)

    def test_known_probability_bet_and_price_limit(self):
        self.assertAlmostEqual(expected_roi(.55, 1.9), .045)
        self.assertAlmostEqual(minimum_price(.55, .02), 1.02 / .55)
        self.assertAlmostEqual(expected_roi(.55, minimum_price(.55, .02)), .02)

    def test_push_and_commission(self):
        self.assertAlmostEqual(expected_roi(.48, 1.91, .15), .0668)
        self.assertAlmostEqual(expected_roi(.55, 2, commission=.05), .0725)
        price = minimum_price(.48, .02, .15, .05)
        self.assertAlmostEqual(expected_roi(.48, price, .15, .05), .02)

    def test_invalid_probabilities_and_prices(self):
        for p, price in ((1.1, 2), (-.1, 2), (.5, 1), (.5, math.inf)):
            with self.assertRaises(ValueError):
                expected_roi(p, price)
        with self.assertRaises(ValueError):
            expected_roi(.7, 2, .4)

    def test_symmetric_markets(self):
        for method in ("proportional", "additive", "power"):
            p = fair_probabilities({"A": 1.91, "B": 1.91}, method)
            self.assertAlmostEqual(p["A"], .5)
            self.assertAlmostEqual(sum(p.values()), 1)

    def test_complete_three_way_market(self):
        for method in ("proportional", "additive", "power"):
            p = fair_probabilities({"home": 2.5, "draw": 3.1, "away": 2.8}, method)
            self.assertAlmostEqual(sum(p.values()), 1)
            self.assertTrue(all(0 <= value <= 1 for value in p.values()))

    def test_underround_and_method_sensitivity(self):
        for method in ("proportional", "additive", "power"):
            p = fair_probabilities({"A": 2.1, "B": 2.1}, method)
            self.assertAlmostEqual(p["A"], .5)
        prices = {"A": 4 / 3, "B": 3.2}
        p1 = fair_probabilities(prices)["A"]
        p2 = fair_probabilities(prices, "additive")["A"]
        self.assertLess(expected_roi(p1, 1.4), 0)
        self.assertGreater(expected_roi(p2, 1.4), 0)

    def test_additive_invalid_tail(self):
        with self.assertRaises(ValueError):
            fair_probabilities({"A": 1.05, "B": 1.05, "C": 100}, "additive")

    def test_scenario_mixture(self):
        self.assertAlmostEqual(scenario_probability([(.7, .6), (.3, .4)]), .54)
        with self.assertRaises(ValueError):
            scenario_probability([(.7, .6), (.4, .4)])

    def test_kelly_is_not_a_stake(self):
        self.assertAlmostEqual(kelly_fraction(.55, 2, .25), .025)
        self.assertEqual(kelly_fraction(.45, 2), 0)

    def test_arb_allocation_payout_identity(self):
        prices = {"A": 2.1, "B": 2.1}
        arb = arbitrage_allocation(prices, 100)
        self.assertTrue(arb["theoretical_arbitrage"])
        self.assertAlmostEqual(sum(arb["stakes"].values()), 100)
        for outcome in prices:
            payout = arb["stakes"][outcome] * prices[outcome]
            self.assertAlmostEqual(payout - 100, arb["profit_before_fees_and_rounding"])
        self.assertFalse(arbitrage_allocation({"A": 1.91, "B": 1.91}, 100)["theoretical_arbitrage"])


class QualityGateTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 10, 24, 18, tzinfo=timezone.utc)
        self.contract = Contract("NBA", "synthetic-event", "player_points", "synthetic-player",
                                 "24.5", "full_game", "synthetic-matching-rules",
                                 ("over", "under"), self.now + timedelta(hours=3))
        self.candidate = Quote(self.contract, "candidate", "candidate_family", "CA-ON",
                               {"over": 2, "under": 1.8}, self.now, self.now, "replay")
        self.refs = [Quote(self.contract, f"ref{i}", f"family{i}", "reference-only",
                           {"over": 1.72, "under": 2.15}, self.now, self.now, "replay")
                     for i in range(3)]

    def run_eval(self, **kwargs):
        options = dict(candidate=self.candidate, outcome="over", references=self.refs, now=self.now)
        options.update(kwargs)
        return evaluate(**options)

    def test_replay_never_claims_live_bet(self):
        result = self.run_eval()
        self.assertEqual(result.decision, "HYPOTHETICAL_CANDIDATE")
        self.assertEqual(result.data_mode, "replay")
        self.assertAlmostEqual(result.central_probability, 5 / 9)

    def test_stale_candidate_and_future_receipt(self):
        stale = replace(self.candidate, confirmed_at=self.now - timedelta(seconds=61))
        self.assertEqual(self.run_eval(candidate=stale).decision, "INSUFFICIENT_DATA")
        future = replace(self.candidate, received_at=self.now + timedelta(seconds=1))
        self.assertIn("candidate:future_timestamp", self.run_eval(candidate=future).reasons)

    def test_naive_timestamp_rejected(self):
        with self.assertRaises(ValueError):
            self.run_eval(now=datetime(2026, 10, 24))

    def test_news_invalidates_old_snapshot(self):
        earlier = self.now - timedelta(seconds=10)
        candidate = replace(self.candidate, confirmed_at=earlier)
        result = self.run_eval(candidate=candidate, material_news_at=self.now)
        self.assertIn("candidate:predates_material_news", result.reasons)

    def test_duplicate_reference_families_do_not_add_evidence(self):
        refs = [replace(ref, family="same_feed") for ref in self.refs]
        self.assertEqual(self.run_eval(references=refs).decision, "INSUFFICIENT_DATA")

    def test_self_reference_excluded(self):
        refs = self.refs[:2] + [replace(self.refs[2], family=self.candidate.family)]
        self.assertEqual(self.run_eval(references=refs).decision, "INSUFFICIENT_DATA")

    def test_exact_contract_required(self):
        for changed in (replace(self.contract, line="25.5"),
                        replace(self.contract, rules_id="different_void_rules"),
                        replace(self.contract, period="first_half")):
            refs = [replace(ref, contract=changed) for ref in self.refs]
            self.assertEqual(self.run_eval(references=refs).decision, "INSUFFICIENT_DATA")

    def test_wrong_region_suspended_and_started(self):
        for changed in (replace(self.candidate, jurisdiction="US-NJ"),
                        replace(self.candidate, suspended=True)):
            self.assertEqual(self.run_eval(candidate=changed).decision, "INSUFFICIENT_DATA")
        self.assertEqual(self.run_eval(now=self.contract.start_at).decision, "INSUFFICIENT_DATA")

    def test_pushable_contract_needs_explicit_model(self):
        candidate = replace(self.candidate, contract=replace(self.contract, has_push=True))
        self.assertIn("push_probability_model_required", self.run_eval(candidate=candidate).reasons)

    def test_missing_outcome_rejected(self):
        with self.assertRaises(ValueError):
            replace(self.candidate, prices={"over": 2})

    def test_price_snapshot_cannot_be_mutated(self):
        prices = {"over": 2, "under": 1.8}
        candidate = replace(self.candidate, prices=prices)
        prices["over"] = 10
        self.assertEqual(candidate.prices["over"], 2)
        with self.assertRaises(TypeError):
            candidate.prices["over"] = 3

    def test_inconsistent_data_modes_rejected(self):
        refs = [replace(ref, mode="live") for ref in self.refs]
        self.assertEqual(self.run_eval(references=refs).decision, "INSUFFICIENT_DATA")

    def test_negative_value_is_pass(self):
        candidate = replace(self.candidate, prices={"over": 1.5, "under": 2.2})
        self.assertEqual(self.run_eval(candidate=candidate).decision, "PASS")

    def test_large_disagreement_is_insufficient_data(self):
        refs = self.refs[:2] + [replace(self.refs[2], prices={"over": 1.2, "under": 4})]
        result = self.run_eval(references=refs)
        self.assertEqual(result.decision, "INSUFFICIENT_DATA")
        self.assertIn("reference_or_method_disagreement", result.reasons)

    def test_invalid_policy_rejected(self):
        for fields in ({"min_reference_families": 0}, {"max_age_seconds": -1}, {"min_ev": -.1}):
            with self.assertRaises(ValueError):
                Policy(**fields)


if __name__ == "__main__":
    unittest.main()
