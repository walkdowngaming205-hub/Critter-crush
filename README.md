# 🐾 Critter Crush

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react&logoColor=black&style=flat-square)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo&logoColor=white&style=flat-square)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Critter Crush** is a pastel-themed, mobile match-3 puzzle adventure built with React Native and Expo. Swap, match, and rescue cute animal critters across multiple levels, unleash power-ups, take on daily challenges, and compete for high scores!

---

## ✨ Features

* **Engaging Match-3 Engine:** Smooth grid mechanics supporting cascading matches, gravity fallbacks, combo multipliers, and shuffle checks.
* **Colorful Critter Cast:** Match a variety of animal tiles (🐱 Cat, 🐶 Dog, 🐰 Bunny, 🐻 Bear, 🦊 Fox, 🐼 Panda, 🐸 Frog, 🐤 Chick) designed with soft pastel aesthetics.
* **Explosive Power-ups:**
  * ⚡ **Lightning:** Blasts full rows and columns.
  * 💣 **Bomb:** Clears surrounding 3x3 areas.
  * 🌈 **Rainbow:** Clears all tiles of a targeted critter.
  * ✨ **Golden Critters:** Streak bonuses and special sparkle bursts.
* **Fluid 60 FPS Animations:** Built with `react-native-reanimated` for snappy tile swaps, match pops, particles, and floating rescue effects.
* **Haptic Feedback:** Integrated device vibrations via `expo-haptics` for tactile tile interactions and match celebrations.
* **Progression & Extra Modes:**
  * 🗺️ **Level Select Map:** Multi-stage campaign with 1–3 star scoring and progression tracking.
  * 🎯 **Daily Challenge:** Unique daily puzzles with bonus rewards.
  * 🎡 **Lucky Spin:** Daily wheel spins to unlock free boosts and power-ups.
  * 🏆 **High Scores:** Track personal bests and level records stored locally with `@react-native-async-storage/async-storage`.
  * ❤️ **Lives System:** Timed life regeneration mechanics.

---

## 🛠️ Tech Stack

* **Framework:** [React Native](https://reactnative.dev/) (v0.81) / [Expo](https://expo.dev/) (SDK 54)
* **Router:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
* **Language:** TypeScript 5.9
* **Animations:** `react-native-reanimated` & `react-native-worklets`
* **Typography:** Fredoka One (Display/Headings) & Nunito (Body) via `@expo-google-fonts`
* **State Management & Storage:** React Context / Provider API + AsyncStorage

---

## 📁 Project Structure

critter_crush/
├── react_native_space/
│   ├── app/                      # Expo Router screens
│   │   ├── _layout.tsx           # Global provider layout & theme setup
│   │   ├── index.tsx             # Main menu / Start screen
│   │   ├── gameplay.tsx          # Core puzzle match board
│   │   ├── level-select.tsx      # World & level progression map
│   │   ├── daily-challenge.tsx   # Daily puzzle mode
│   │   ├── lucky-spin.tsx        # Mini-game wheel spin
│   │   ├── high-scores.tsx       # Leaderboards / Local bests
│   │   └── settings.tsx          # Sound, haptics, and reset options
│   ├── src/
│   │   ├── components/game/      # GameBoard, TileView, Particles, Modals
│   │   ├── components/ui/        # Buttons, StarProgressBar, LivesDisplay
│   │   ├── constants/            # Levels, critters, and tile types
│   │   ├── engine/               # Board logic, match checks, RNG
│   │   ├── hooks/                # useGameEngine, useBoardCell
│   │   ├── state/                # GameProvider & lives timer context
│   │   ├── theme/                # Pastel color palette & typography
│   │   └── utils/                # Haptics, date math, sound helpers
│   ├── package.json
│   └── app.json
├── ux_design.md                  # Complete UX & animation specification
└── sim/                          # Engine simulation test scripts



Try:
|
🚀 Getting Started
Prerequisites

Ensure you have the following installed on your machine:

Node.js (v18 or higher recommended)
Yarn (v4.x is configured in this repository)
Expo Go app installed on your iOS or Android physical device (or an iOS Simulator / Android Emulator).
Installation & Run
Navigate to the React Native project directory:
bash
Copy
cd react_native_space
Try:
|
Enable Corepack and install dependencies:
bash
Copy
corepack enable
yarn install
Try:
|
Start the development server:
bash
Copy
yarn start
Try:
|
Launch the game:
Mobile Device: Scan the QR code displayed in the terminal with the Expo Go app (Android) or the Camera app (iOS).
iOS Simulator: Press i in the terminal.
Android Emulator: Press a in the terminal.
Web Preview: Press w in the terminal (runs expo start --web).
🎮 How to Play
Swap Tiles: Drag or tap adjacent critters to line up 3 or more of the same animal horizontally or vertically.
Form Combos: Match 4 or 5 critters in a line, T-shape, or L-shape to spawn Bomb, Lightning, and Rainbow tiles.
Complete Level Objectives: Reach target point thresholds or rescue specific critter counts before running out of moves.
Preserve Lives: Failing a level consumes a heart. Lives regenerate over time or can be replenished through the Lucky Spin.
📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
