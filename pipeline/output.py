"""
Data Output Module — Saves pipeline results as JSON for the frontend.
"""

import json
import os
from datetime import datetime, timezone


def save_events_json(events, output_dir="data"):
    """
    Save events to a JSON file grouped by niche.

    Args:
        events: List of scored, tagged event dicts.
        output_dir: Directory to save the JSON file.

    Returns:
        Path to the saved file.
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Get today's date for the filename
    today = datetime.now(timezone.utc)
    date_str = today.strftime("%Y-%m-%d")
    filename = f"events_{date_str}.json"

    # Also create a "latest.json" that always points to today
    latest_file = os.path.join(output_dir, "events.json")
    dated_file = os.path.join(output_dir, filename)

    # Group events by niche
    niche_groups = {}
    for event in events:
        for niche in event.get("niches", []):
            if niche not in niche_groups:
                niche_groups[niche] = []
            niche_groups[niche].append(event)

    # Build the output structure
    output = {
        "date": date_str,
        "total_events": len(events),
        "events": events,  # All events sorted by score
        "niches": niche_groups,  # Events grouped by niche
    }

    # Save dated file
    with open(dated_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # Save latest file (overwrites each day)
    with open(latest_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nOutput saved:")
    print(f"  Latest: {latest_file}")
    print(f"  Dated:  {dated_file}")
    print(f"  Events: {len(events)}")

    return latest_file


def save_niche_summaries(events, output_dir="data"):
    """
    Save a lightweight niche summary file for the homepage grid.

    Contains just the top event and event count per niche.
    """
    os.makedirs(output_dir, exist_ok=True)

    niche_summaries = {}

    # Group events by niche
    for event in events:
        for niche in event.get("niches", []):
            if niche not in niche_summaries:
                niche_summaries[niche] = {
                    "top_event": None,
                    "count": 0,
                }
            niche_summaries[niche]["count"] += 1

            # Set top event (first one is highest scored due to sorting)
            if niche_summaries[niche]["top_event"] is None:
                niche_summaries[niche]["top_event"] = {
                    "year": event.get("year"),
                    "description": event.get("description"),
                    "image_url": event.get("image_url", ""),
                }

    # Save
    summary_file = os.path.join(output_dir, "niche_summaries.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(niche_summaries, f, ensure_ascii=False, indent=2)

    print(f"  Niche summaries saved to: {summary_file}")
    return summary_file
