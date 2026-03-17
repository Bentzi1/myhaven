# MyHaven 🌿
**A safe, anonymous space for sharing life stories.**

MyHaven is a React-based application designed to provide users with a secure, non-judgmental, and completely anonymous environment to share life stories, sensitive experiences, and precious memories. The application focuses on mental peace, privacy, and community support through a soft, pastel-themed aesthetic.

## ✨ Key Features
- **Anonymous Feed:** Browse stories from others in a clean, calming, and distraction-free interface.
- **Safe Writing Space (React-Managed):** A state-driven writing interface with a real-time character counter (1,500-character limit).
- **AI Anonymity Check:** A smart scanning feature integrated into the publishing flow to prevent the accidental exposure of identifying details (names, locations, etc.).
- **Empathic Interactions:** Instead of traditional "likes," users can "Send a Hug" to show solidarity and support.
- **My Stories:** A private area for users to manage and track their own anonymous contribution history.

## 🎨 Design Language
The design is implemented using **Tailwind CSS** and follows principles of tranquility:
- **Palette:** Soft pastel tones (Cream `#FDF9F3`, Pale Lavender `#F9F7FD`, Sky Blue `#78A6C8`).
- **Typography:** Clean, sans-serif fonts with wide line spacing (`leading-relaxed`) for comfortable reading.
- **UX:** Smooth Single Page Application (SPA) transitions and immediate visual feedback for user actions.

## 🛠 Tech Stack
- **Library:** React.js
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Routing:** React Router DOM (for seamless screen navigation)
- **State Management:** React Hooks (`useState`, `useEffect`)

## 📁 Project Structure (React Components)
- `src/components/`:
  - `BottomNav.jsx`: The persistent navigation menu.
  - `StoryCard.jsx`: Reusable component for story previews in the feed.
  - `AICheckModal.jsx`: The overlay for anonymity verification results.
- `src/pages/`:
  - `Home.jsx`: The main community feed.
  - `Write.jsx`: The content creation screen with AI logic.
  - `Profile.jsx`: The "My Haven" personal history area.
  - `Onboarding.jsx`: The gentle, welcoming entry screen.

---
*Created with ❤️ for a safer digital world.*