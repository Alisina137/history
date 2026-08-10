"""Spot check niche tagging accuracy."""

import json

with open("data/events.json", "r", encoding="utf-8") as f:
    data = json.load(f)

events = data["events"]
tagged = [e for e in events if "space" in e["description"].lower() and e["niches"]]

print("Space-related events:")
for e in tagged[:5]:
    print(f"  {e['year']}: {e['description'][:80]}... -> {e['niches']}")
