"""Quick test of the scoring system."""

from fetch_events import parse_event
from score_events import calculate_event_score

# Create test events
event1 = parse_event(
    {
        "year": 1969,
        "text": "Apollo 11 lands on the Moon",
        "pages": [{"normalizedtitle": "Apollo_11"}],
    },
    "event",
)
event1["page_views"] = 500000
event1["categories"] = [
    "Space exploration",
    "NASA",
    "Moon landings",
    "1969 in spaceflight",
    "Apollo program",
]

event2 = parse_event(
    {
        "year": 2023,
        "text": "Local mayor elected",
        "pages": [{"normalizedtitle": "Some_town"}],
    },
    "event",
)
event2["page_views"] = 50
event2["categories"] = ["Elections", "Local government"]

calculate_event_score(event1)
calculate_event_score(event2)

print(f"Apollo 11 Score: {event1['global_score']}")
print(f"Mayor Election Score: {event2['global_score']}")
print(f"Apollo > Mayor: {event1['global_score'] > event2['global_score']}")
