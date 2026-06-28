# 🏀 HoopShare

**Organise ton match. Partage les frais. Tout le monde paie, personne ne galère.**

HoopShare is a mobile-first web application designed to simplify the organization and cost-sharing of pickup basketball games. It features a sleek "Pro Max" OLED design aesthetic, glassmorphism UI, fluid CSS animations, and real-time backend synchronization via Firebase.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

---

## ✨ Features

- **Guest Login Flow:** Frictionless entry. Users can log in anonymously, choose a pseudo, and immediately join a game or pledge for lighting.
- **Deep Linking:** Send players a direct link to a game (e.g. `?gameId=abc`) or share via auto-generated QR Codes so they land directly on the RSVP page.
- **Financial Splitter:** Clear, upfront cost breakdown per person. It handles court fees and optional dynamic lighting fees in multiple currencies (XOF, EUR, USD, CAD).
- **Real-Time Synchronization:** Instant syncing of game RSVPs, player counts, lighting pledges, and live emoji reactions using Firebase Firestore.
- **Premium UI/UX:** Deep OLED blacks, neon orange accents, dynamic island navigation, and smooth staggered animations optimized for mobile web.
- **Performance Optimized:** Dropped heavy 3D WebGL in favor of sleek, lightweight CSS animations for maximum frame rates on mobile devices.

## 🛠 Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS v4 (Custom UI Tokens)
- **Animations:** Framer Motion & CSS
- **Backend & Auth:** Firebase (Google Auth, Anonymous Auth, Firestore)
- **Utilities:** `lucide-react` (icons), `qrcode.react` (sharing)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Firebase project created (with Firestore, Google Auth, and **Anonymous Auth** enabled)

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Installation & Run
```bash
npm install
npm run dev
```
Navigate to `http://localhost:5173/` to see the app running locally.

---

## 🗑 How to reset / delete test data

If you were testing the app and want to reset all games, players, and data:

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Click on **Firestore Database** in the left menu.
3. Click the three dots (`⋮`) next to the `games` collection, and select **Delete collection**.
4. Repeat this for the `users` collection.
5. Go to **Authentication** in the left menu.
6. Check the box next to all the test users (both Anonymous and Google) and click **Delete account**.

*Note: The app is designed to recreate these collections automatically when new users log in and create games.*

---

## 🌐 Deployment (Vercel)

1. Push this code to a GitHub repository.
2. Import the repository into your Vercel dashboard.
3. Add the environment variables from your `.env.local` file into Vercel's environment variables settings.
4. Go to **Firebase Console -> Authentication -> Settings -> Authorized Domains** and add your Vercel domain (e.g. `your-app.vercel.app`) so Google Login works in production.
5. Click **Deploy!**

---
*Built with passion, performance, and premium aesthetics in mind.*
