"""
AI Image Generation using Replicate API.
Generates a hero image for the day's top event.
"""

import os
import time


def generate_hero_image(event):
    """
    Generate an AI hero image for an event using Replicate.

    Args:
        event: Event dict with 'description' and 'year'.

    Returns:
        Image URL string or empty string if generation fails.
    """
    api_token = os.environ.get("REPLICATE_API_TOKEN")

    if not api_token or api_token == "your_replicate_token_here":
        print("  No Replicate API token found. Skipping image generation.")
        print("  Set REPLICATE_API_TOKEN in your .env file to enable.")
        return ""

    try:
        import replicate

        client = replicate.Client(api_token=api_token)

        # Build the prompt
        description = event.get("description", "A historical event")
        year = event.get("year", "")

        prompt = (
            f"A historically inspired, artistic illustration of: {description}. "
            f"Set in {year}. "
            f"Style: vintage oil painting meets digital art, dramatic lighting, "
            f"cinematic composition, rich colors, historically evocative, "
            f"no modern elements, no text, no labels."
        )

        print(f"  Generating AI image for: {description[:80]}...")

        output = client.run(
            "stability-ai/stable-diffusion-3.5-large",
            input={
                "prompt": prompt,
                "num_outputs": 1,
                "aspect_ratio": "16:9",
                "output_format": "webp",
            },
        )

        if output and len(output) > 0:
            image_url = output[0]
            print(f"  Image generated: {image_url[:80]}...")
            return image_url

        return ""

    except ImportError:
        print("  Replicate package not installed. Skipping image generation.")
        return ""
    except Exception as e:
        print(f"  Error generating image: {e}")
        return ""


def generate_hero_for_top_event(events):
    """
    Generate a hero image for the top-ranked event.

    Args:
        events: Sorted list of events (highest score first).

    Returns:
        The events list with the top event's image_url updated.
    """
    if not events:
        return events

    top_event = events[0]
    print(f"\nGenerating hero image for top event: {top_event['description'][:80]}...")

    image_url = generate_hero_image(top_event)

    if image_url:
        top_event["hero_image_url"] = image_url
        top_event["image_url"] = image_url

    return events
