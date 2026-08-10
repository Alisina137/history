"""
Daily Pipeline Orchestrator
Runs the full pipeline: fetch → enrich → tag → score → image → output.
"""

import sys
import time
from datetime import datetime, timezone

from fetch_events import get_events_for_date, enrich_event
from tag_events import tag_all_events
from score_events import score_all_events
from generate_image import generate_hero_for_top_event
from output import save_events_json, save_niche_summaries


def run_pipeline(month=None, day=None, year=None, enrich_limit=None):
    """
    Run the complete daily pipeline.
    """
    print("=" * 60)
    print("  TODAY IN HISTORY — DAILY PIPELINE")
    print("=" * 60)

    start_time = time.time()

    # ---- Stage 1: Fetch ----
    print("\n[Stage 1/5] Fetching events from Wikipedia...")
    events = get_events_for_date(month=month, day=day, enrich=False)
    print(f"  Fetched {len(events)} raw events.")

    # ---- Stage 2: Enrich ----
    print("\n[Stage 2/5] Enriching events with metadata...")
    events_to_enrich = events[:enrich_limit] if enrich_limit else events
    for i, event in enumerate(events_to_enrich):
        if (i + 1) % 50 == 0:
            print(f"  Processed {i + 1}/{len(events_to_enrich)} events...")
        enrich_event(event)
        time.sleep(0.05)
    print(f"  Enriched {len(events_to_enrich)} events.")

    # ---- Stage 3: Tag ----
    print("\n[Stage 3/5] Tagging events with niches...")
    events = tag_all_events(events)
    print(f"  Tagged {len(events)} events.")

    # ---- Stage 4: Score ----
    print("\n[Stage 4/5] Scoring events by significance...")
    events = score_all_events(events)
    if events:
        print(f"  Top event: {events[0]['year']} — {events[0]['description'][:80]}...")
    else:
        print("  No events found for this date.")

    # ---- Stage 5: Image ----
    print("\n[Stage 5/5] Generating AI hero image...")
    events = generate_hero_for_top_event(events)

    # ---- Save Output ----
    print("\nSaving output...")
    save_events_json(events)
    save_niche_summaries(events)

    # ---- Summary ----
    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print(f"  PIPELINE COMPLETE")
    print(f"  Total events: {len(events)}")
    print(f"  Time: {elapsed:.1f} seconds")
    print("=" * 60)

    return events


if __name__ == "__main__":
    month = None
    day = None

    if len(sys.argv) >= 3:
        month = int(sys.argv[1])
        day = int(sys.argv[2])
        print(f"Running pipeline for date: {month}/{day}")
    else:
        now = datetime.now(timezone.utc)
        print(f"Running pipeline for today: {now.month}/{now.day}")

    events = run_pipeline(month=month, day=day, enrich_limit=20)

    print("\n--- Niche Distribution ---")
    niche_counts = {}
    for event in events:
        for niche in event.get("niches", []):
            niche_counts[niche] = niche_counts.get(niche, 0) + 1

    for niche, count in sorted(niche_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {niche}: {count} events")
