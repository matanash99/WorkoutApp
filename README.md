# 🏋️‍♂️ Personal Workout Tracker (PWA)

A minimalist, high-performance Progressive Web App (PWA) built to track gym workouts, sets, reps, and weights. Designed with a clean, monochromatic interface, this app feels and acts like a native mobile application and is self-hosted on a Raspberry Pi using Cloudflare Tunnels.

## ✨ Features
* **Native App Experience (PWA):** Fully installable on both Android and iOS home screens. Opens in full-screen mode without browser UI.
* **Custom Exercise Library:** Includes custom-generated, white-background animated GIFs for exercises (Squats, Bench Press, Cleans, The Saw, etc.).
* **Live Database:** Built on SQLite to privately and securely store all workout history, sets, and RPE data locally on the hardware.
* **Minimalist UI:** Strict black-and-white monospace aesthetic for a distraction-free gym experience.
* **Remote Access:** Accessible anywhere in the world via a secure Cloudflare Tunnel, without needing to open router ports.

## 🛠️ Tech Stack
* **Frontend:** Vanilla HTML5, CSS3, JavaScript (Fetch API)
* **Backend:** Node.js, Express.js
* **Database:** SQLite3
* **Deployment & Hosting:** Raspberry Pi (Linux OS)
* **Process Management:** PM2
* **Networking:** Cloudflare Quick Tunnels (`cloudflared`)

## 📂 Project Structure
```text
WorkoutApp/
├── frontend/
│   ├── index.html        # Main PWA interface
│   ├── styles.css        # Monochromatic styling & responsive UI
│   ├── app.js            # Frontend logic and API calls
│   └── assets/           # Custom exercise GIFs and PWA icons
├── backend/
│   ├── server.js         # Express API routing
│   ├── database.sqlite   # Live SQLite vault (Do not overwrite in prod!)
│   ├── seed.js           # Initial database population script
│   ├── add_one.js        # Utility: Inject single exercise
│   └── delete_one.js     # Utility: Remove single exercise
└── package.json          # Node dependencies
