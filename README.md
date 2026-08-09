# Today in History

A personalized "Today in History" platform that lets users explore the past through their own passions, with a stunning AI-generated visual every single day.

## Features

- **Daily AI Hero Image** — A unique, AI-generated artistic image for the day's most significant historical event.
- **30 Passion Niches** — Browse history through niches like Space Exploration, Music History, True Crime, and more.
- **Personalized Favorites** — Save your favorite niches and get a merged, ranked feed just for you.
- **Mobile-First Design** — Beautiful on every screen size.
- **Always Free** — No paywall, no account required.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Static Site Generator:** Custom Node.js build script
- **Data Pipeline:** Python (Wikipedia API + AI Image Generation)
- **Hosting:** Cloudflare Pages
- **Automation:** GitHub Actions (daily cron)

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/today-in-history.git
cd today-in-history

# Install frontend dependencies
npm install

# Install pipeline dependencies
pip install -r requirements.txt