# Critter Crush — UX Specification

## Design Direction

- **Theme**: Bright, playful, pastel — light mode with warm off-white background (#FFF8F0)
- **Color Palette**: Primary Coral #FF6B6B + Accent Violet #A855F7. Secondary accents: Mint #34D399, Sky #38BDF8, Amber #FBBF24
- **Backgrounds**: Layered pastel gradients (peach → lavender → mint) per screen context. Gameplay board on a soft cream (#FFF5E6) with subtle radial gradient
- **Typography**: Display/Heading: "Fredoka One" (Google Fonts, rounded playful). Body: "Nunito" (Google Fonts, clean rounded). Type scale: Display 32px → Heading 22px → Body 16px → Caption 13px
- **Tile Design**: Rounded squares (borderRadius: 12), each tile ~42x42pt with large centered emoji, subtle inner shadow, pastel-tinted background matching the animal's color identity
- **Animal Color Map**: 🐱 #FFB6C1 (pink), 🐶 #93C5FD (blue), 🐰 #C4B5FD (purple), 🐻 #D2A679 (brown), 🦊 #FDBA74 (orange), 🐼 #E5E7EB (silver), 🐸 #86EFAC (green), 🐤 #FDE68A (yellow)
- **Power-up Tiles**: Lightning ⚡ gold glow border, Bomb 💣 red pulsing border, Rainbow 🌈 prismatic animated border
- **Golden Animal Tile** (streak reward): shimmering gold background with sparkle particle overlay

## Animation & Motion

- **All animations**: react-native-reanimated shared values + withSpring / withTiming at 60fps
- **Tile swap**: 200ms spring translation; invalid swap snaps back with a shake (translateX oscillation)
- **Match clear**: tiles scale to 1.3 then 0 over 250ms with opacity fade; particle burst (8-12 small colored circles expanding outward using reanimated transforms)
- **Gravity drop**: tiles fall with spring physics (damping: 12, stiffness: 150), staggered 30ms per row
- **New tile entry**: fade in + drop from above the board with spring
- **Cascade multiplier popup**: scale from 0→1.2→1.0 spring, hold 600ms, fade out. Text: "2x!", "3x!", "4x!"
- **Combo text**: "SWEET!" (3-match), "AMAZING!" (4-match), "LEGENDARY!" (5+ match) — fly in from right, bounce, fade after 800ms
- **Star award**: each star spins in (rotateZ 0→360) with scale spring, staggered 300ms
- **Lucky Spin wheel**: continuous rotation with deceleration (withDecay), pointer indicator bounces
- **Screen transitions**: fade + slide (300ms)
- **Button press**: scale 0.95 spring + haptic (Haptics.impactAsync light on native, skip on web)
- **Haptics**: match clear (medium), combo (heavy), invalid swap (notification error), win (success), button tap (light). Respect settings toggle. Skip on web.
- **Reduced motion**: check AccessibilityInfo, disable particle effects and reduce animation durations to 100ms

## File Structure (expo-router)

```
app/
  _layout.tsx              # Root Stack layout, loads fonts, wraps GameProvider
  index.tsx                # Home Screen
  level-select.tsx         # Level Select / World Map
  gameplay.tsx             # Main Gameplay Screen (receives levelId as search param)
  daily-challenge.tsx      # Daily Challenge Gameplay
  lucky-spin.tsx           # Lucky Spin Wheel
  high-scores.tsx          # High Scores Board
  settings.tsx             # Settings Screen
```

## Screens

### 1. Home Screen (`index.tsx`)
**Purpose**: Main menu entry point with animated branding.

**Layout**:
- Pastel gradient background (peach #FFDDD2 → lavender #E2D1F9)
- Top: "Critter Crush" title in Fredoka One 36px, coral color, with subtle bounce loop animation
- Center: 3-4 animal emojis (🐱🐶🐰🦊) floating with gentle sine-wave vertical oscillation (reanimated, offset phases)
- Streak indicator: if active streak ≥ 1 day, show flame icon + "🔥 X day streak!" badge below title
- Below animals, vertical button stack (16px gap):
  - **"▶ Play"** — gradient button [#FF6B6B, #A855F7], large (width 220, height 56), rounded 28. Navigates to Level Select
  - **"⭐ Daily Challenge"** — gradient button [#FBBF24, #F97316]. If already completed today, show checkmark overlay and "Completed!" subtitle. Navigates to Daily Challenge screen
  - **"🏆 High Scores"** — outlined button, coral border. Navigates to High Scores
  - **"⚙️ Settings"** — outlined button, gray border. Navigates to Settings
- Bottom: Lives display — row of heart emojis (❤️ filled, 🤍 empty), max 5. If lives < 5, show refill timer "Next life in MM:SS" (lives regenerate every 30 minutes)

**User Actions**:
- Tap Play → push Level Select
- Tap Daily Challenge → push Daily Challenge
- Tap High Scores → push High Scores
- Tap Settings → push Settings

---

### 2. Level Select (`level-select.tsx`)
**Purpose**: Scrollable world map showing all levels with lock/star status.

**Layout**:
- Header: back arrow (pop) + "Select Level" title
- Scrollable vertical list of level nodes arranged in a winding path pattern (alternating left-right offset)
- Each level node is a circular button (64x64):
  - **Unlocked + unplayed**: white circle, level number in coral
  - **Completed**: colored circle matching star count gradient, 1-3 small star icons below
  - **Locked**: gray circle with 🔒 icon, opacity 0.5
  - **Current (next to play)**: pulsing glow animation (coral shadow oscillation)
- Every 5th level node has a special "🐾 Animal Rescue!" badge
- Path lines connecting nodes (thin dashed lines via View borders)
- Background: scrolling mint-to-sky gradient

**Data** (from AsyncStorage via GameProvider):
- `levels`: array of {levelId, unlocked, stars (0-3), highScore}
- Level unlocked if previous level completed (level 1 always unlocked)

**User Actions**:
- Tap unlocked level → push Gameplay with `?levelId=N`
- Tap locked level → shake animation, no navigation
- Scroll vertically through all levels
- Back arrow → pop to Home

---

### 3. Gameplay Screen (`gameplay.tsx`)
**Purpose**: Core match-3 puzzle board.

**Layout** (top to bottom):
- **Top bar**: Back button (with confirm dialog "Quit level?") | Level number | Star progress bar (3 star thresholds shown as markers on a horizontal bar, current score fills it)
- **Score area**: Current score (large, Fredoka One 28px) | Target score label | Moves remaining (circular badge, bold number)
- **Game board**: 8x8 grid centered, tiles are ~42x42pt with 3pt gap. Board has rounded container (borderRadius 16) with subtle shadow on cream background
  - Each tile: rounded square with pastel background + large emoji centered
  - Power-up tiles have animated borders (glow effect via shadow oscillation)
  - Hint highlight: pulsing white border on hinted tile pair
- **Power-up bar** (below board): Row of 3 slots:
  - Shuffle button (🔀) — shows "1" badge if available, grayed if used
  - Collected power-ups display (if any stored — for future extensibility, currently power-ups activate on creation)
- **Combo counter**: floating overlay top-right of board, shows current cascade multiplier
- **Combo text popups**: centered over board, animated text ("SWEET!", "AMAZING!", "LEGENDARY!")

**Game Logic** (all in-memory, React state + useReducer):
- **Board state**: 8x8 2D array of {type: emoji, id: unique, isPowerUp: null|'lightning'|'bomb'|'rainbow', isGolden: boolean}
- **Level config**: {levelId, targetScore, maxMoves, availableTypes: subset of 8 animals, starThresholds: [1star, 2star, 3star]}
- **Tile selection**: tap a tile to select (highlight border), tap adjacent tile to attempt swap. OR swipe gesture on a tile to swap in swipe direction.
- **Swap validation**: after swap animation, check for matches. If no match, revert swap with shake animation.
- **Match detection** (robust, simultaneous):
  1. Scan entire board for horizontal runs of 3+ same type
  2. Scan entire board for vertical runs of 3+ same type
  3. Collect ALL matched positions (union of horizontal + vertical matches)
  4. Detect special patterns: 4-in-row → mark one position for Lightning; L/T shape (3+3 sharing corner) → mark for Bomb; 5-in-row → mark for Rainbow
  5. Clear matched tiles, create power-up tiles at swap position if applicable
- **Power-up activation**:
  - Lightning: when matched or tapped during swap, clears entire row OR column (whichever has more matches, or random)
  - Bomb: clears 3x3 area centered on bomb tile
  - Rainbow: when swapped with any tile, clears ALL tiles of that type from board
- **Gravity**: after clearing, tiles above empty spaces drop down (animated). New random tiles generated at top.
- **Cascade**: after gravity + fill, re-check for matches. Cascade multiplier increments (2x, 3x, 4x). Repeat until no matches.
- **Scoring**: base 10 points per tile cleared × cascade multiplier. Bonus for power-up clears.
- **No-moves detection**: after every board settle, check if any valid swap exists. If none, auto-reshuffle with animation (tiles scatter and reassemble).
- **Hint system**: after 5 seconds of no input, highlight a valid move (pulsing border on two tiles). Hint button forces immediate hint.
- **Move consumption**: each player-initiated swap (valid or invalid) costs 1 move.
- **Win condition**: score ≥ target score (can keep playing remaining moves for higher star count)
- **Lose condition**: moves reach 0 and score < target
- **Animal Rescue** (every 5th level): on win, show special celebration — rescued animal emoji flies to center with confetti particle burst, "You rescued 🐱!" text. 2 second animation before win modal.

**End States**:
- Win → show Win Modal overlay
- Lose → navigate to Lose Screen

**User Actions**:
- Tap/swipe tiles to swap
- Tap shuffle button (once per level)
- Tap hint button
- Tap back → confirm dialog → pop to Level Select

---

### 4. Win Modal (overlay on Gameplay)
**Purpose**: Celebrate level completion, show stars earned.

**Layout**:
- Semi-transparent backdrop with blur
- Centered card (glass effect, rounded 24):
  - "Level Complete! 🎉" heading
  - Star display: 1-3 stars animate in (spin + scale spring), staggered
  - Score display with high score indicator if new record ("🏆 New High Score!")
  - If Animal Rescue level: rescued animal display with sparkles
  - Three buttons stacked:
    - **"Next Level ▶"** — gradient button, navigates to next level gameplay (or Level Select if last level)
    - **"Replay 🔄"** — outlined button, restarts current level
    - **"Home 🏠"** — text button, pops to Home
  - If 3 stars earned: "🎰 Lucky Spin available!" banner, tapping it navigates to Lucky Spin

**Data written to AsyncStorage**:
- Update level stars (max of previous and current)
- Update level high score
- Unlock next level
- Deduct 0 lives (win doesn't cost life)
- Track animal rescue if applicable

---

### 5. Lose Screen (`gameplay.tsx` — state-driven overlay or replace)
**Purpose**: Show failure state, offer retry.

**Layout**:
- Sad pastel background (muted lavender)
- Large sad animal emoji (😿) with gentle wobble animation
- "Oh no!" heading
- "You needed {remaining} more points" subtitle
- Score achieved display
- Two buttons:
  - **"Try Again ❤️"** — gradient button (costs 1 life, shown on button). If 0 lives, button disabled with "No lives! Next in MM:SS"
  - **"Home 🏠"** — outlined button, pops to Home

**Data written**: deduct 1 life from AsyncStorage

---

### 6. Daily Challenge (`daily-challenge.tsx`)
**Purpose**: Special daily level with unique seed.

**Layout**: Same as Gameplay screen but with:
- Header shows "Daily Challenge ⭐" instead of level number
- Date display (e.g., "Dec 15, 2024")
- No moves limit — instead has a 3-minute countdown timer (displayed prominently)
- Score target for bonus star
- If already completed today: show completion summary (score, star earned) with "Come back tomorrow!" and countdown to midnight

**Game Logic**:
- Board seeded by date string (deterministic random using simple hash of YYYY-MM-DD)
- Same tile types and layout for all players on same day
- Win: score ≥ target within time limit → earn bonus star (tracked separately)
- Lose: timer expires → show score achieved, no life cost

**Data**: `dailyChallenges` in AsyncStorage: Record<dateString, {completed: boolean, score: number, starEarned: boolean}>

---

### 7. Lucky Spin (`lucky-spin.tsx`)
**Purpose**: Reward wheel after 3-star wins.

**Layout**:
- Festive gradient background (gold → coral)
- "Lucky Spin! 🎰" heading
- Spinning wheel (circular, 6 segments with different colors):
  - Segments: +500 pts, +1000 pts, +2000 pts, Free Shuffle, Extra Life, +5000 pts
  - Wheel rendered as a circle with colored segments (View transforms + rotation)
  - Pointer triangle at top
- **"SPIN!"** large gradient button
- After spin: result announcement with celebration animation, "Collect" button
- Back/Home button

**Logic**:
- Spin available only when navigated here after 3-star win (pass param `?available=true`)
- Random result with weighted probabilities (higher points = lower chance)
- Points added to that level's score in AsyncStorage
- Extra Life adds 1 life (max 5)

---

### 8. High Scores (`high-scores.tsx`)
**Purpose**: View personal best scores per level.

**Layout**:
- Header: back arrow + "High Scores 🏆"
- Scrollable list of levels with scores:
  - Each row: Level number | Star icons (filled/empty) | High score | Best moves remaining
  - Completed levels only (skip locked/unplayed)
  - Sorted by level number
- Total stats at top: Total stars earned / Total possible, Levels completed count
- Daily Challenge section at bottom: best daily score, total daily stars

---

### 9. Settings (`settings.tsx`)
**Purpose**: App preferences and progress management.

**Layout**:
- Header: back arrow + "Settings ⚙️"
- Toggle rows (react-native-paper Switch):
  - 🔊 Sound Effects (stored but no actual audio — visual feedback only in v1)
  - 📳 Haptic Feedback (controls whether haptics fire on native)
- Divider
- Streak info: current streak display, "Play daily to keep your streak!"
- Divider
- **"Reset All Progress"** — destructive red button with confirmation dialog ("This will erase all progress, scores, and unlocked levels. Are you sure?")
- App version at bottom (caption text)

---

## Navigation

**Style**: Stack navigator (expo-router Stack from `_layout.tsx`)

**Flow**:
```
Home (index)
  ├── Level Select → Gameplay → [Win Modal / Lose overlay]
  │                              Win → Lucky Spin (if 3 stars)
  │                              Win → Next Level (new Gameplay)
  ├── Daily Challenge
  ├── High Scores
  └── Settings
```

- All navigation is imperative (event-driven, no auth)
- No authentication, no protected routes
- Back gestures enabled on all screens
- Gameplay → Home requires confirmation dialog if game in progress

## State Management

**GameProvider** (React Context + useReducer) wrapping entire app:

**Persisted State** (AsyncStorage, loaded on app start with splash/loading):
```typescript
interface GameState {
  levels: LevelProgress[];        // {levelId, unlocked, stars, highScore}
  lives: number;                  // max 5
  lastLifeLostAt: string | null;  // ISO8601 for life regen timer
  streak: {
    currentStreak: number;
    lastPlayedDate: string | null; // YYYY-MM-DD
    goldenTileUnlocked: boolean;
  };
  dailyChallenges: Record<string, {completed: boolean, score: number, starEarned: boolean}>;
  settings: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
  totalStars: number;             // derived but cached
  rescuedAnimals: string[];       // emoji list of rescued animals
}
```

**Level Definitions** (hardcoded constant, not in AsyncStorage):
```typescript
interface LevelDef {
  levelId: number;
  targetScore: number;
  maxMoves: number;
  availableTypes: string[];       // subset of 8 emojis
  starThresholds: [number, number, number]; // 1-star, 2-star, 3-star score thresholds
  isRescueLevel: boolean;         // every 5th level
}
```

- Levels 1-5: 4-5 tile types, low targets (500-1500), generous moves (25-30)
- Levels 6-10: 5-6 tile types, medium targets (1500-3000), 20-25 moves
- Levels 11-15: 6-7 tile types, higher targets (3000-5000), 18-22 moves
- Levels 16-20+: 7-8 tile types, high targets (5000-8000), 15-20 moves

**Life Regeneration**: timer checks every second, adds 1 life per 30 minutes since `lastLifeLostAt`, capped at 5.

**Streak Logic**: on any level completion (win), check `lastPlayedDate`. If yesterday → increment streak. If today → no change. If older → reset to 1. If streak ≥ 3 → unlock golden tile.

## Component Standards

- **Tile Component**: Animated.View with reanimated shared values for position, scale, opacity. Pressable with onPress (select) and PanGestureHandler (swipe). Memoized with React.memo.
- **Board Component**: 8x8 FlatList or mapped Views in rows. Absolute positioning for smooth gravity animations.
- **Buttons**: LinearGradient background (expo-linear-gradient), Pressable with scale animation
- **Cards/Modals**: rounded 20, elevated shadow, semi-transparent backdrop
- **Loading**: skeleton shimmer on Level Select while AsyncStorage loads
- **Empty states**: not applicable (levels always defined)
- **Accessibility**: all buttons have accessibilityLabel, tiles have accessibilityHint ("row X column Y, cat tile"), minimum 44pt touch targets
- **Spacing**: 8pt grid throughout
