"""
Niche Tagging Engine — Tags events with 1-3 niches based on
Wikipedia categories and event description keywords.
"""

# ---- Niche Definitions (matches niches.json from Phase 2) ----

NICHE_KEYWORDS = {
    "wars-battles": {
        "categories": [
            "Battles",
            "Wars",
            "Military",
            "Conflict",
            "Warfare",
            "Sieges",
            "Invasions",
            "Rebellions",
            "Revolutions",
            "Coup",
            "Terrorist incidents",
            "Massacres",
        ],
        "keywords": [
            "war",
            "battle",
            "military",
            "invasion",
            "siege",
            "rebels",
            "troops",
            "army",
            "navy",
            "air force",
            "missile",
            "bomb",
            "attack",
            "defense",
            "offensive",
        ],
    },
    "politics-revolutions": {
        "categories": [
            "Elections",
            "Presidents",
            "Prime ministers",
            "Political",
            "Referendums",
            "Independence",
            "Treaties",
            "Diplomacy",
            "Government",
            "Legislation",
            "Law",
            "Constitution",
        ],
        "keywords": [
            "president",
            "election",
            "vote",
            "parliament",
            "congress",
            "senate",
            "governor",
            "mayor",
            "minister",
            "political",
            "independence",
            "declared",
            "treaty",
            "diplomatic",
        ],
    },
    "empires-dynasties": {
        "categories": [
            "Empires",
            "Monarchs",
            "Dynasties",
            "Ancient Rome",
            "Ancient Greece",
            "Ottoman",
            "Byzantine",
            "Persian",
            "Pharaohs",
            "Kings",
            "Queens",
        ],
        "keywords": [
            "empire",
            "emperor",
            "king",
            "queen",
            "dynasty",
            "ancient",
            "rome",
            "greece",
            "egypt",
            "roman",
            "ottoman",
            "byzantine",
            "persian",
        ],
    },
    "space-exploration": {
        "categories": [
            "Space",
            "NASA",
            "Spacecraft",
            "Astronauts",
            "Space exploration",
            "Moon",
            "Planets",
            "Satellites",
        ],
        "keywords": [
            "space",
            "nasa",
            "astronaut",
            "moon",
            "mars",
            "satellite",
            "rocket",
            "lunar",
            "orbit",
            "spacecraft",
            "apollo",
            "space station",
            "cosmonaut",
        ],
    },
    "inventions-technology": {
        "categories": [
            "Inventions",
            "Technology",
            "Computing",
            "Internet",
            "Software",
            "Engineering",
            "Patents",
            "Telecommunications",
        ],
        "keywords": [
            "invented",
            "invention",
            "patent",
            "technology",
            "computer",
            "internet",
            "software",
            "phone",
            "telegraph",
            "radio",
            "television",
            "first",
            "introduced",
            "launched",
        ],
    },
    "medicine-health": {
        "categories": [
            "Medicine",
            "Health",
            "Diseases",
            "Medical",
            "Vaccines",
            "Hospitals",
            "Surgery",
            "Pharmaceuticals",
            "Pandemics",
        ],
        "keywords": [
            "medicine",
            "disease",
            "vaccine",
            "hospital",
            "surgery",
            "doctor",
            "medical",
            "health",
            "pandemic",
            "epidemic",
            "virus",
            "cure",
            "treatment",
        ],
    },
    "archaeology-discoveries": {
        "categories": [
            "Archaeology",
            "Discoveries",
            "Fossils",
            "Artifacts",
            "Excavations",
            "Anthropology",
        ],
        "keywords": [
            "discovered",
            "archaeologist",
            "fossil",
            "artifact",
            "tomb",
            "ruins",
            "excavation",
            "ancient",
            "dinosaur",
            "buried",
        ],
    },
    "music-history": {
        "categories": [
            "Music",
            "Musicians",
            "Albums",
            "Songs",
            "Bands",
            "Composers",
            "Concerts",
            "Opera",
            "Jazz",
            "Rock",
        ],
        "keywords": [
            "music",
            "song",
            "album",
            "band",
            "singer",
            "musician",
            "concert",
            "composer",
            "opera",
            "symphony",
            "guitar",
            "piano",
            "beatles",
            "elvis",
        ],
    },
    "cinema-film": {
        "categories": [
            "Films",
            "Cinema",
            "Movies",
            "Actors",
            "Directors",
            "Hollywood",
            "Academy Awards",
            "Animation",
        ],
        "keywords": [
            "film",
            "movie",
            "actor",
            "actress",
            "director",
            "cinema",
            "hollywood",
            "oscar",
            "screening",
            "premiere",
        ],
    },
    "literature-writers": {
        "categories": [
            "Books",
            "Literature",
            "Writers",
            "Poets",
            "Novels",
            "Publishing",
            "Authors",
        ],
        "keywords": [
            "book",
            "novel",
            "author",
            "writer",
            "poet",
            "poem",
            "published",
            "literature",
            "shakespeare",
            "dickens",
        ],
    },
    "art-architecture": {
        "categories": [
            "Art",
            "Artists",
            "Paintings",
            "Sculptures",
            "Architecture",
            "Museums",
            "Galleries",
        ],
        "keywords": [
            "art",
            "artist",
            "painting",
            "sculpture",
            "museum",
            "gallery",
            "architect",
            "building",
            "cathedral",
            "monument",
        ],
    },
    "sports-history": {
        "categories": [
            "Sports",
            "Olympics",
            "Football",
            "Cricket",
            "Basketball",
            "Tennis",
            "Athletics",
            "World records",
        ],
        "keywords": [
            "sport",
            "olympic",
            "football",
            "soccer",
            "championship",
            "tournament",
            "match",
            "world cup",
            "record",
            "athlete",
        ],
    },
    "true-crime": {
        "categories": [
            "Crime",
            "Murder",
            "Serial killers",
            "Robberies",
            "Fraud",
            "Criminals",
            "Prisons",
        ],
        "keywords": [
            "murder",
            "killed",
            "crime",
            "criminal",
            "robbery",
            "prison",
            "executed",
            "assassinated",
            "mafia",
            "gang",
        ],
    },
    "women-in-history": {
        "categories": [
            "Women",
            "Feminism",
            "Women's rights",
            "Suffrage",
        ],
        "keywords": [
            "woman",
            "women",
            "female",
            "suffrage",
            "feminist",
            "first woman",
            "first female",
            "queen",
        ],
    },
    "natural-disasters": {
        "categories": [
            "Earthquakes",
            "Tsunamis",
            "Volcanoes",
            "Hurricanes",
            "Floods",
            "Tornadoes",
            "Natural disasters",
        ],
        "keywords": [
            "earthquake",
            "tsunami",
            "volcano",
            "hurricane",
            "flood",
            "tornado",
            "disaster",
            "eruption",
            "storm",
        ],
    },
    "business-economics": {
        "categories": [
            "Business",
            "Economics",
            "Companies",
            "Stock market",
            "Banking",
            "Finance",
            "Trade",
        ],
        "keywords": [
            "company",
            "stock",
            "market",
            "bank",
            "economy",
            "trade",
            "business",
            "corporation",
            "founded",
            "merged",
            "acquired",
        ],
    },
    "strange-unexplained": {
        "categories": [
            "UFO",
            "Paranormal",
            "Mysteries",
            "Conspiracy",
            "Supernatural",
        ],
        "keywords": [
            "ufo",
            "mystery",
            "strange",
            "unexplained",
            "alien",
            "ghost",
            "paranormal",
            "conspiracy",
            "disappeared",
        ],
    },
    "firsts-in-history": {
        "keywords": [
            "first",
            "first-ever",
            "first time",
            "becomes first",
            "first person",
            "first woman",
            "first man",
        ],
    },
}


def tag_event(event):
    """
    Tag a single event with 1-3 niches based on categories and keywords.

    Args:
        event: Standardized event dict with 'categories' and 'description'.

    Returns:
        The same event with 'niches' field populated.
    """
    categories = event.get("categories", [])
    description = event.get("description", "").lower()
    matched_niches = []

    for niche_id, rules in NICHE_KEYWORDS.items():
        score = 0

        # Check categories
        cat_keywords = rules.get("categories", [])
        for cat in categories:
            cat_lower = cat.lower()
            for ck in cat_keywords:
                if ck.lower() in cat_lower:
                    score += 3  # Category match is strong
                    break

        # Check description keywords
        text_keywords = rules.get("keywords", [])
        for kw in text_keywords:
            if kw.lower() in description:
                score += 1  # Text match is weaker

        if score > 0:
            matched_niches.append((niche_id, score))

    # Sort by score (highest first) and take top 3
    matched_niches.sort(key=lambda x: x[1], reverse=True)
    top_niches = [n[0] for n in matched_niches[:3]]

    # If no niche matched, assign "General History"
    if not top_niches:
        top_niches = ["general-history"]

    event["niches"] = top_niches
    return event


def tag_all_events(events):
    """
    Tag all events with niches.

    Args:
        events: List of standardized event dicts.

    Returns:
        The same list with niches added to each event.
    """
    print(f"Tagging {len(events)} events with niches...")
    for i, event in enumerate(events):
        if (i + 1) % 50 == 0:
            print(f"  Tagged {i + 1}/{len(events)} events...")
        tag_event(event)
    print("Tagging complete.")
    return events
