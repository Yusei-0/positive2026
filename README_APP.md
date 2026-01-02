# Positive Vibes App

This application is designed to deliver a daily dose of positivity with a premium, aesthetic interface.

## Features

- **Daily Inspiration**: Fetches inspirational quotes from a public API.
- **Beautiful UI**: Uses Glassmorphism (frosted glass effect), animated background blobs, and smooth transitions for a modern, high-quality feel.
- **Premium Typography**: Integrates the "Outfit" font for a clean, professional look.
- **Interactive**:
  - "Inspire Me" button to get a new quote instantly.
  - "Share" button to native share the quote (on supported devices) or copy to clipboard.
- **Resilient**: Includes a fallback list of timeless quotes if the API is unreachable or offline.

## Tech Stack

- **Framework**: Ionic + Angular (Standalone Components)
- **Styling**: SCSS with CSS Variables and Keyframe Animations
- **API**: `quotable.io` (Free, Open Source Quote API)

## How to Run

1. `npm install` (if not already done)
2. `ionic serve` or `ng serve`
