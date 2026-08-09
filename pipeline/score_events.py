"""
Global Significance Scoring Algorithm
Ranks events by importance using multiple signals.
"""

import math


def calculate_event_score(event):
    """
    Calculate a global significance score for an event.

    Factors:
    1. Page views (popularity signal)
    2. Number of categories (article quality signal)
    3. Event type (historical events > births > deaths)
    4. Recency bonus (very recent events get a small boost)

    Returns:
        Float score (0-100 scale, approximately).
    """
    score = 0.0

    # ---- Factor 1: Page Views (0-40 points) ----
    page_views = event.get("page_views", 0)
    if page_views > 0:
        # Log scale to compress the range
        # 1,000 views → ~12 points, 100,000 → ~24, 10,000,000 → ~36
        view_score = math.log(page_views + 1, 10) * 4
        score += min(view_score, 40)

    # ---- Factor 2: Categories Count (0-20 points) ----
    categories = event.get("categories", [])
    num_categories = len(categories)
    if num_categories > 0:
        cat_score = min(num_categories * 2, 20)
        score += cat_score

    # ---- Factor 3: Event Type (0-25 points) ----
    event_type = event.get("type", "event")
    type_scores = {
        "event": 25,  # Historical events are most important
        "birth": 15,  # Births are secondary
        "death": 10,  # Deaths are tertiary
    }
    score += type_scores.get(event_type, 10)

    # ---- Factor 4: Recency (0-10 points) ----
    year = event.get("year", 0)
    if isinstance(year, int) and year >= 2000:
        recency_bonus = min((year - 2000) * 0.4, 10)
        score += recency_bonus

    # ---- Factor 5: Has Image (0-5 points) ----
    if event.get("image_url"):
        score += 5

    # Round to 1 decimal place
    event["global_score"] = round(score, 1)
    return event


def score_all_events(events):
    """
    Score all events and sort by global_score (highest first).

    Args:
        events: List of event dicts with metadata.

    Returns:
        List of events sorted by global_score descending.
    """
    print(f"Scoring {len(events)} events...")

    for event in events:
        calculate_event_score(event)

    # Sort by score, highest first
    events.sort(key=lambda e: e.get("global_score", 0), reverse=True)

    # Print top 5 for verification
    print("\nTop 5 events by score:")
    for i, event in enumerate(events[:5]):
        print(
            f"  {i + 1}. [{event['global_score']}] {event['year']}: {event['description'][:80]}..."
        )

    print("Scoring complete.")
    return events
