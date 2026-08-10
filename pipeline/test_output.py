"""Test the pipeline JSON output structure."""
import json

with open('data/events.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

e = data['events'][0]
print('Keys:', list(e.keys()))
print('Has year:', 'year' in e)
print('Has description:', 'description' in e)
print('Has niches:', 'niches' in e)
print('Has global_score:', 'global_score' in e)
print('Has image_url:', 'image_url' in e)