"""
Fetch "On This Day" events from Wikipedia API.
Wikipedia REST API is free and requires no authentication.
"""

import requests
from datetime import datetime
import json
import time


# Wikipedia REST API base URL
WIKIPEDIA_API_BASE = "https://en.wikipedia.org/api/rest_v1"


def fetch_on_this_day(month=None, day=None):
    """
    Fetch all "On This Day" events for a given month and day.
    Makes separate API calls for events, births, and deaths.
    """
    if month is None:
        month = datetime.now().month
    if day is None:
        day = datetime.now().day

    headers = {
        "User-Agent": "TodayInHistory/1.0 (https://github.com/yourusername/today-in-history; your-email@example.com)"
    }

    result = {"events": [], "births": [], "deaths": []}

    # Fetch each type separately
    endpoints = {
        "events": f"{WIKIPEDIA_API_BASE}/feed/onthisday/events/{month}/{day}",
        "births": f"{WIKIPEDIA_API_BASE}/feed/onthisday/births/{month}/{day}",
        "deaths": f"{WIKIPEDIA_API_BASE}/feed/onthisday/deaths/{month}/{day}",
    }

    for event_type, url in endpoints.items():
        print(f"Fetching {event_type} from: {url}")

        try:
            response = requests.get(url, timeout=30, headers=headers)
            response.raise_for_status()
            data = response.json()

            # The API wraps lists differently for each type
            if event_type == "events":
                result[event_type] = data.get("events", [])
            elif event_type == "births":
                result[event_type] = data.get("births", [])
            elif event_type == "deaths":
                result[event_type] = data.get("deaths", [])

            # Small delay to be polite to Wikipedia's servers
            time.sleep(0.5)

        except requests.exceptions.RequestException as e:
            print(f"Error fetching {event_type}: {e}")
            result[event_type] = []

    return result


def parse_event(raw_event, event_type="event"):
    """
    Parse a raw Wikipedia event into our standard event object.

    Args:
        raw_event: Raw event dict from Wikipedia API.
        event_type: String: "event", "birth", or "death".

    Returns:
        dict with standardized event fields.
    """
    # Extract the year from the text (Wikipedia format: "Year – Description")
    year = raw_event.get("year", "Unknown")

    # Extract the description text
    text = raw_event.get("text", "")

    # Extract Wikipedia article links
    pages = raw_event.get("pages", [])

    # Get the main Wikipedia article URL
    wikipedia_url = ""
    article_title = ""

    if pages:
        # Use the first (most relevant) page
        first_page = pages[0]
        article_title = first_page.get("normalizedtitle", "")
        if article_title:
            encoded_title = article_title.replace(" ", "_")
            wikipedia_url = f"https://en.wikipedia.org/wiki/{encoded_title}"

    # Build our standardized event object
    event = {
        "year": year,
        "description": text,
        "type": event_type,
        "wikipedia_url": wikipedia_url,
        "article_title": article_title,
        "image_url": "",  # Will be populated later
        "niches": [],     # Will be populated by tagging engine
        "global_score": 0,  # Will be calculated by scoring algorithm
    }

    return event


def get_events_for_date(month=None, day=None):
    """
    Main function: Fetch and parse all events for a given date.

    Returns:
        list of standardized event dicts.
    """
    raw_data = fetch_on_this_day(month, day)

    all_events = []

    # Parse historical events
    for raw_event in raw_data.get("events", []):
        event = parse_event(raw_event, "event")
        all_events.append(event)

    # Parse births
    for raw_event in raw_data.get("births", []):
        event = parse_event(raw_event, "birth")
        all_events.append(event)

    # Parse deaths
    for raw_event in raw_data.get("deaths", []):
        event = parse_event(raw_event, "death")
        all_events.append(event)

    print(f"Total events fetched: {len(all_events)}")
    print(f"  - Historical events: {len(raw_data.get('events', []))}")
    print(f"  - Births: {len(raw_data.get('births', []))}")
    print(f"  - Deaths: {len(raw_data.get('deaths', []))}")

    return all_events


# ---- Test the module directly ----
if __name__ == "__main__":
    # Fetch today's events
    events = get_events_for_date()

    # Print the first 3 events as a sample
    print("\n--- Sample Events ---")
    for event in events[:3]:
        print(f"\nYear: {event['year']}")
        print(f"Type: {event['type']}")
        print(f"Description: {event['description']}")
        print(f"Wikipedia: {event['wikipedia_url']}")
