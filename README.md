🌍 AI Trip Planner 🚀
====================

*A smart travel planning assistant powered by Google Gemini and Google APIs*

[![npm version](https://img.shields.io/npm/v/package.json.svg)](https://www.npmjs.com/package/package.json)
[![GitHub stars](https://img.shields.io/github/stars/RoshanMuhammedR/AI_Trip_Planner?style=social)](https://github.com/RoshanMuhammedR/AI_Trip_Planner/stargazers)

Overview
--------

AI Trip Planner is an intelligent travel assistant that helps users generate personalized travel itineraries based on their preferences. Whether you're a solo traveler, a couple, or a family, this application creates detailed day-wise itineraries complete with hotel suggestions and real images of the locations using the power of AI and cloud APIs.

Features
--------

- ⚡ **Progressive generation**: a fast skeleton call lands you on a real trip page in seconds, then each day is generated in parallel and fills in live — no long blank spinner.
- 🗺️ **Interactive day map**: every stop plotted as a numbered marker coloured by day; click a marker to jump to its card, hover a card to highlight its marker.
- ✨ **Chat-to-refine**: reshape any day in plain language ("make day 2 more relaxed", "more food, less museums"), with one-click Undo.
- 📅 **Real dates & budgets**: optional start date gives per-day dates, seasonality-aware suggestions, `.ics` calendar export, and an estimated trip total.
- 🔗 **Share & export**: shareable read-only links, native share sheet on mobile, and a print stylesheet for clean PDFs.
- 🌓 **Light & dark themes**, responsive layouts, and keyboard-accessible controls throughout.
- 👤 **Firebase Auth (Google)**: secure sign-in, with Firestore rules enforcing per-user trip ownership.
- 🔒 **Server-side AI key**: generation is proxied through a Vercel function, so the API key never reaches the browser.

Demo
----

👉 Live Demo: https://ai-trip-planner-rho-orcin.vercel.app/

Getting Started
---------------

### Installation

```bash
# Clone the repository
git clone https://github.com/RoshanMuhammedR/AI_Trip_Planner.git

# Move into the project directory
cd AI_Trip_Planner

# Install dependencies
npm install

# Copy the env template and fill in your keys
cp .env.example .env
```

### Running locally

Trip generation goes through a Vercel serverless function at `/api/generate`,
which holds the AICredits key server-side. Plain `vite` doesn't serve `/api`, so:

```bash
# Full app, including trip generation (requires: npm i -g vercel && vercel link)
npm run dev:api

# UI only — faster, but "Generate Trip" will 404
npm run dev
```

> **Note on keys:** `AICREDITS_API_KEY` deliberately has no `VITE_` prefix. Vite
> inlines every `VITE_*` variable into the client bundle, so anything prefixed
> that way is public. Set the same variable in your Vercel project settings for
> deployments.

### Firebase setup

1. **Authentication → Sign-in method → Google**: enable it, and add your dev and
   production domains under **Authorized domains**.
2. **Firestore → Rules**: deploy `firestore.rules` from the repo root. It allows
   read-by-link (for sharing) but restricts writes to the trip's owner.

Tech Stack
----------

- **Frontend**: React.js, TailwindCSS, shadcn/ui
- **Backend**: Vercel serverless functions
- **Authentication**: Firebase Auth (Google provider)
- **Database**: Cloud Firestore
- **Maps**: `@vis.gl/react-google-maps`
- **APIs Used**:
  - AICredits gateway (Gemini)
  - Google Places API (New)
- **Deployment**: Vercel

### How generation works

Rather than one long request for the whole itinerary, generation is split:

1. **Skeleton** — one small, fast call returning hotels plus a day-by-day shell
   (theme + best time to visit). The trip is saved and rendered immediately.
2. **Days** — one call per day, fired in parallel, each returning just that
   day's places. They stream into the page as they land.

This keeps each response small enough for a fast model to return valid JSON,
makes total latency roughly the slowest single day instead of the sum, and means
a reload mid-generation resumes rather than leaving a half-built trip. Refining a
day later reuses the exact same call.

Trips are normalized through `src/lib/tripSchema.js` on read, so documents saved
before the schema change still render correctly.

Author
------

**Roshan Muhammed R**

- GitHub: https://github.com/RoshanMuhammedR
- LinkedIn: https://linkedin.com/in/roshan2004

Show Your Support
-----------------

If you found this project helpful, please consider giving it a ⭐️ on GitHub!
