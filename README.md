# 🎮 Children's Day Esports Tournament Registration Portal 🕹️

A modern, real-time web application built for organizing school-based esports tournaments (Counter-Strike 2, Brawlhalla, and Rocket League) for Children's Day. The system handles live team registrations and dynamically updates the team list across all connected devices instantly without page refreshes.

## 🚀 Features

- **Real-Time Data Sync:** Powered by Firebase Firestore (`onSnapshot`). Registrations appear instantly on everyone's screen.
- **Dynamic Game Filters:** Users can instantly filter the registration table by specific games (CS2, Brawlhalla, Rocket League) or view all teams.
- **Split Class Selection:** Players from the same team do not need to be from the same class; separate class inputs are provided for both Player 1 and Player 2.
- **Mobile Responsive Design:** Advanced CSS Media Queries optimize the layout into elegant cards for mobile screens and school Wi-Fi users.
- **Anti-Cheat & Anti-Spam Protections:**
  - Strict 10-second request throttling per user session.
  - Global tournament capacity hard-cap (100 teams maximum).
  - Robust backend-level unique checks for Team Names (case-insensitive).
  - Cross-field duplicate player validation (prevents a player from registering in multiple teams or different games since tournaments run simultaneously).

## 🛠️ Tech Stack

- **Frontend Framework:** React 19 (via Vite for ultra-fast compilation)
- **Database:** Firebase Firestore (NoSQL Real-time Database)
- **Hosting:** Firebase Hosting (Production-ready SSL-secured deployment)
- **Styling:** Pure CSS3 (featuring responsive card layouts and modern gaming dark-mode aesthetics)

## 📁 Project Structure

```text
turniej-app/
├── public/
├── src/
│   ├── App.css          # Responsive styling & flash animations
│   ├── App.jsx          # Main application core logic & form validation
│   ├── firebase.js      # Firebase SDK initialization & Firestore export
│   └── main.jsx         # React DOM entry point
├── firebase.json        # Firebase Hosting deployment configurations
├── package.json         # Project dependencies & scripts
└── README.md            # Project documentation
