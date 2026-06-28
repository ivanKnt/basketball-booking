# 🏀 HoopShare (Pro Max Edition)

HoopShare is an ultra-premium, mobile-first web application designed to simplify the organization and cost-sharing of pickup basketball games. It features a "Pro Max" OLED design aesthetic, glassmorphism UI, fluid Framer Motion animations, and real-time backend synchronization via Firebase.

![HoopShare Banner](https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge) ![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features
- **Premium UI/UX:** Deep OLED blacks, neon orange accents, dynamic island navigation, and smooth staggered animations.
- **3D Web Experience:** Interactive, mouse-tracking WebGL 3D basketball rendered with React Three Fiber.
- **Real-Time Data:** Instant synchronization of game RSVPs, cost pooling, and emoji reactions using Firebase Firestore.
- **Financial Splitter:** Automatic per-player cost division for court fees and optional lighting fees with 50 XOF increment constraints.
- **Smart Forms:** Fluid height transitions and custom dropdowns for selecting dates, times, and player counts.
- **Map Integration:** Built-in map preview for court locations.

## 🛠 Tech Stack
- **Frontend Framework:** React 18 + Vite
- **Styling:** Tailwind CSS v4 (Custom UI Tokens)
- **Animations:** Framer Motion (Spring physics, layout transitions)
- **3D Rendering:** React Three Fiber & Three.js
- **Backend & Auth:** Firebase (Google Auth + Firestore)
- **Maps:** React Leaflet
- **QR Generation:** qrcode.react

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Firebase project created (with Firestore and Google Auth enabled)

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

### 3. Installation
```bash
npm install
npm run dev
```
Navigate to `http://localhost:5173/` to see the app running locally.

## 🌐 Deployment
The app is optimized for static hosting platforms like Vercel or Firebase Hosting.

**To deploy to Vercel:**
1. Push the code to a GitHub repository.
2. Import the repository into your Vercel dashboard.
3. Add the environment variables from your `.env.local` file into Vercel's environment variables settings.
4. Click Deploy!

---
*Built with passion, performance, and premium aesthetics in mind.*
