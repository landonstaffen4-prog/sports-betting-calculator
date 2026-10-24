"""Evaluate a normalised JSON snapshot. No network requests or API credentials."""
import argparse
import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from .core import Contract, Policy, Quote, evaluate


def timestamp(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def quote(data, contract):
    fields = dict(data)
    fields["confirmed_at"] = timestamp(fields["confirmed_at"])
    fields["received_at"] = timestamp(fields["received_at"])
    return Quote(contract=contract, **fields)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--as-of", help="Explicit timestamp for reproducible historical replay")
    args = parser.parse_args()
    try:
        data = json.loads(args.snapshot.read_text())
        fields = dict(data["contract"])
        fields["outcomes"] = tuple(fields["outcomes"])
        fields["start_at"] = timestamp(fields["start_at"])
        contract = Contract(**fields)
        candidate = quote(data["candidate"], contract)
        if args.as_of and candidate.mode != "replay":
            raise ValueError("--as-of is reserved for replay fixtures")
        refs = [quote(ref, contract) for ref in data["references"]]
        now = timestamp(args.as_of) if args.as_of else datetime.now(timezone.utc)
        news = timestamp(data["material_news_at"]) if data.get("material_news_at") else None
        result = evaluate(candidate, data["outcome"], refs, now,
                          Policy(**data.get("policy", {})), news)
        print(json.dumps(asdict(result), indent=2, allow_nan=False))
    except (ValueError, TypeError, KeyError, OSError) as exc:
        parser.exit(2, f"Invalid input: {exc}\n")


if __name__ == "__main__":
    main()
