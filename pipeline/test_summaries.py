"""Check niche summaries."""

import json

with open("data/niche_summaries.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("Niches:", len(data))
for k, v in list(data.items())[:5]:
    print(f'  {k}: {v["count"]} events')
