"""
Fetch "On This Day" events from Wikipedia API.
Wikipedia REST API is free and requires no authentication.
"""

import time
from datetime import datetime, timezone

import requests

# Wikipedia REST API base URL
WIKIPEDIA_API_BASE = "https://en.wikipedia.org/api/rest_v1"


def fetch_on_this_day(month=None, day=None):
    """
    Fetch all "On This Day" events for a given month and day.
    Makes separate API calls for events, births, and deaths.
    """
    if month is None:
        month = datetime.now(timezone.utc).month
    if day is None:
        day = datetime.now(timezone.utc).day

    headers = {
        "User-Agent": "TodayInHistory/1.0 (https://github.com/yourusername/today-in-history; your-email@example.com)"
    }

    result = {"events": [], "births": [], "deaths": []}

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

            if event_type == "events":
                result[event_type] = data.get("events", [])
            elif event_type == "births":
                result[event_type] = data.get("births", [])
            elif event_type == "deaths":
                result[event_type] = data.get("deaths", [])

            time.sleep(0.5)

        except requests.exceptions.RequestException as e:
            print(f"Error fetching {event_type}: {e}")
            result[event_type] = []

    return result


def parse_event(raw_event, event_type="event"):
    """
    Parse a raw Wikipedia event into our standard event object.
    """
    year = raw_event.get("year", "Unknown")
    text = raw_event.get("text", "")
    pages = raw_event.get("pages", [])

    wikipedia_url = ""
    article_title = ""

    if pages:
        first_page = pages[0]
        article_title = first_page.get("normalizedtitle", "")
        if article_title:
            encoded_title = article_title.replace(" ", "_")
            wikipedia_url = f"https://en.wikipedia.org/wiki/{encoded_title}"

    event = {
        "year": year,
        "description": text,
        "type": event_type,
        "wikipedia_url": wikipedia_url,
        "article_title": article_title,
        "image_url": "",
        "categories": [],
        "page_views": 0,
        "niches": [],
        "global_score": 0,
    }

    return event


# ---- Metadata Extraction Functions ----


def fetch_article_categories(article_title):
    """Fetch Wikipedia categories for a given article using the page info API."""
    if not article_title:
        return []

    encoded_title = article_title.replace(" ", "_")
    url = "https://en.wikipedia.org/w/api.php"

    params = {
        "action": "query",
        "format": "json",
        "titles": article_title,
        "prop": "categories",
        "cllimit": "10",
    }

    headers = {
        "User-Agent": "TodayInHistory/1.0 (https://github.com/yourusername/today-in-history; your-email@example.com)"
    }

    try:
        response = requests.get(url, params=params, timeout=10, headers=headers)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                categories = page_data.get("categories", [])
                return [
                    cat.get("title", "").replace("Category:", "") for cat in categories
                ]
        return []
    except requests.exceptions.RequestException:
        return []


def fetch_article_image(article_title):
    """Fetch the main thumbnail image URL for a Wikipedia article."""
    if not article_title:
        return ""

    encoded_title = article_title.replace(" ", "_")
    url = f"{WIKIPEDIA_API_BASE}/page/summary/{encoded_title}"

    headers = {
        "User-Agent": "TodayInHistory/1.0 (https://github.com/yourusername/today-in-history; your-email@example.com)"
    }

    try:
        response = requests.get(url, timeout=10, headers=headers)
        if response.status_code == 200:
            data = response.json()
            thumbnail = data.get("thumbnail", {})
            return thumbnail.get("source", "")
        return ""
    except requests.exceptions.RequestException:
        return ""


def fetch_page_views(article_title):
    """Fetch recent page view count for a Wikipedia article."""
    if not article_title:
        return 0

    encoded_title = article_title.replace(" ", "_")

    # Get current date for the pageview request
    now = datetime.now(timezone.utc)
    end_date = now.strftime("%Y%m%d00")
    start_date = now.replace(day=1).strftime("%Y%m%d00")

    url = f"{WIKIPEDIA_API_BASE}/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/{encoded_title}/monthly/{start_date}/{end_date}"

    headers = {
        "User-Agent": "TodayInHistory/1.0 (https://github.com/yourusername/today-in-history; your-email@example.com)"
    }

    try:
        response = requests.get(url, timeout=10, headers=headers)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            if items:
                total_views = sum(item.get("views", 0) for item in items)
                return total_views
        return 0
    except requests.exceptions.RequestException:
        return 0


def enrich_event(event):
    """Add metadata (categories, image, page views) to a single event."""
    article_title = event.get("article_title", "")

    if article_title:
        event["categories"] = fetch_article_categories(article_title)
        event["image_url"] = fetch_article_image(article_title)
        event["page_views"] = fetch_page_views(article_title)

    return event


# ---- Main Function ----


def get_events_for_date(month=None, day=None, enrich=True):
    """
    Main function: Fetch and parse all events for a given date.
    """
    raw_data = fetch_on_this_day(month, day)

    all_events = []

    for raw_event in raw_data.get("events", []):
        event = parse_event(raw_event, "event")
        all_events.append(event)

    for raw_event in raw_data.get("births", []):
        event = parse_event(raw_event, "birth")
        all_events.append(event)

    for raw_event in raw_data.get("deaths", []):
        event = parse_event(raw_event, "death")
        all_events.append(event)

    print(f"Total events fetched: {len(all_events)}")
    print(f"  - Historical events: {len(raw_data.get('events', []))}")
    print(f"  - Births: {len(raw_data.get('births', []))}")
    print(f"  - Deaths: {len(raw_data.get('deaths', []))}")

    if enrich:
        print("\nEnriching events with metadata...")
        for i, event in enumerate(all_events):
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(all_events)} events...")
            enrich_event(event)
            time.sleep(0.1)
        print("Metadata enrichment complete.")

    return all_events


# ---- Test the module directly ----
if __name__ == "__main__":
    # Fetch events but only enrich the first 50 for faster testing
    raw_data = fetch_on_this_day()

    all_events = []

    for raw_event in raw_data.get("events", []):
        event = parse_event(raw_event, "event")
        all_events.append(event)

    for raw_event in raw_data.get("births", []):
        event = parse_event(raw_event, "birth")
        all_events.append(event)

    for raw_event in raw_data.get("deaths", []):
        event = parse_event(raw_event, "death")
        all_events.append(event)

    print(f"Total events fetched: {len(all_events)}")

    # Only enrich the first 50 events
    sample_size = min(50, len(all_events))
    print(f"\nEnriching first {sample_size} events with metadata...")
    for i, event in enumerate(all_events[:sample_size]):
        if (i + 1) % 10 == 0:
            print(f"  Processed {i + 1}/{sample_size} events...")
        enrich_event(event)
        time.sleep(0.1)
    print("Metadata enrichment complete.")

    print("\n--- Sample Events (with metadata) ---")
    for event in all_events[:3]:
        print(f"\nYear: {event['year']}")
        print(f"Type: {event['type']}")
        print(f"Description: {event['description'][:100]}...")
        print(f"Wikipedia: {event['wikipedia_url']}")
        print(f"Image: {event.get('image_url', 'None')[:80]}...")
        print(f"Page Views: {event.get('page_views', 0)}")
        print(f"Categories: {event.get('categories', [])[:3]}...")
