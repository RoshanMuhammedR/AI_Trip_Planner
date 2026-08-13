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

- 🌐 **Gemini via AICredits**: Generates customized itineraries and hotel suggestions in JSON, proxied through a serverless function so the API key never reaches the browser.
- 🗺️ **Google Places & Images API**: Fetches precise location details and enhances itineraries with real-world images.
- 👤 **Firebase Auth (Google)**: Secure sign-in, with Firestore rules enforcing per-user trip ownership.
- 📜 **Trip History**: Users can view and revisit previously planned trips.
- 🧠 **AI Prompting**: Dynamic prompts designed to optimize responses from Gemini for travel planning.

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
- **APIs Used**:
  - AICredits gateway (Gemini)
  - Google Places API (New)
- **Deployment**: Vercel

Author
------

**Roshan Muhammed R**

- GitHub: https://github.com/RoshanMuhammedR
- LinkedIn: https://linkedin.com/in/roshan2004

Show Your Support
-----------------

If you found this project helpful, please consider giving it a ⭐️ on GitHub!
