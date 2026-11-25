# 09 React Native Capstone Project - Cookbook App

A React Native + Expo + React Native Paper cookbook application using the [DummyJSON Recipes API](https://dummyjson.com/docs/recipes).

---

## 📋 Grading Rubric & Scoring Mechanics

### 👥 Group Composition
- Groups are **3 members by default**; **4 members is permitted** when class size requires it — **group size carries no penalty**
- All members receive the **same base score** (adjusted by peer evaluation)
- Individual contribution tracked via Git commits & PR reviews

### 🎯 Total Score: 100 Points

| Category | Weight | Points | Description |
|----------|--------|--------|-------------|
| **Core Functionality** | 40% | 40 pts | Required features working correctly |
| **Code Quality** | 20% | 20 pts | TypeScript, architecture, patterns |
| **UI/UX & Polish** | 15% | 15 pts | Design consistency, responsiveness, animations |
| **Authentication & Security** | 10% | 10 pts | Auth flow, token handling, protected routes |
| **Testing & Reliability** | 10% | 10 pts | Unit/integration tests, error handling |
| **Documentation & Presentation** | 5% | 5 pts | README, demo video, code comments |

---

### 📊 Detailed Scoring Breakdown

#### 1. Core Functionality (40 pts)
| Feature | Points | Criteria |
|---------|--------|----------|
| Recipe Discovery (Home) | 5 | Pagination, loading states, error handling, images load |
| Recipe Search & Filters | 8 | Query search, category/cuisine/difficulty filters, sort options, debounced input |
| Recipe Detail Screen | 8 | Full recipe: ingredients, instructions, nutrition, tags, rating, reviews |
| Favorites System | 8 | Add/remove, AsyncStorage persistence, badge counts, empty state |
| Categories Screen | 5 | Grid layout, category counts, navigation to filtered results |
| User Profile | 6 | Edit profile (PUT /users/{id}), stats, settings, logout |

#### 2. Code Quality (20 pts)
| Criterion | Points | Expectation |
|-----------|--------|-------------|
| TypeScript Strict Mode | 5 | Zero `any`, proper interfaces, strict null checks |
| Architecture | 5 | Context + useReducer for state, service layer for API, custom hooks |
| Component Reusability | 4 | Shared components in `components/`, proper prop typing |
| Git Hygiene | 3 | Conventional commits, PR reviews, no direct pushes to main |
| Linting & Formatting | 3 | `npm run lint` passes, consistent Prettier formatting |

#### 3. UI/UX & Polish (15 pts)
| Criterion | Points | Expectation |
|-----------|--------|-------------|
| Design System Consistency | 5 | Paper theme used throughout, consistent spacing/typography |
| Loading & Empty States | 4 | Skeletons, spinners, friendly empty states with CTAs |
| Navigation & Transitions | 3 | Smooth tab transitions, proper back handling, deep links |
| Responsive Layout | 3 | Works on phone/tablet, safe areas, keyboard avoidance |

#### 4. Authentication & Security (10 pts)
| Criterion | Points | Expectation |
|-----------|--------|-------------|
| Login Flow | 3 | Working login, validation, error messages, demo account |
| Register Flow | 3 | Complete implementation, validation, auto-login |
| Token Management | 2 | Auto-refresh on 401, secure storage, logout clears tokens |
| Protected Routes | 2 | Auth guard redirects unauthenticated users |

#### 5. Testing & Reliability (10 pts)
| Criterion | Points | Expectation |
|-----------|--------|-------------|
| Unit Tests | 4 | Context reducers, utils, hooks (≥70% coverage) |
| Integration Tests | 3 | Auth flow, API services, navigation |
| Error Boundaries | 2 | Graceful error handling, user-friendly messages |
| Type Safety | 1 | `npm run typecheck` passes with zero errors |

#### 6. Documentation & Presentation (5 pts)
| Criterion | Points | Expectation |
|-----------|--------|-------------|
| README | 2 | Group info, setup, features, API docs, screenshots |
| Demo Video (2-3 min) | 2 | Walkthrough of all features, smooth narration |
| Code Comments | 1 | Complex logic documented and implementation notes resolved |

---

### ⚖️ Peer Evaluation Adjustment
Each member submits a **confidential peer evaluation** (1-5 scale) for:
- **Contribution** (code, reviews, meetings)
- **Collaboration** (communication, reliability, help)
- **Quality** (code standards, testing, documentation)

**Adjustment Formula:**
```
Individual Score = Group Base Score × (Peer Average / 3.5)
```
- Peer avg 5.0 → +14% bonus (capped at 100)
- Peer avg 3.5 → no change
- Peer avg 2.0 → -43% penalty
- Peer avg 1.0 → -71% penalty

---

### 📅 Late Submission Penalty
Submissions are accepted up to 7 days after the deadline. Late penalties are prorated daily based on the following schedule:

| Delay | Penalty |
| :--- | :--- |
| **Daily Rate** | -12.5% per 24-hour period (prorated) |
| **Max Penalty** | -62.5% (after 5 days) |
| **> 7 days** | **0 points** (No submission accepted) |

> ℹ️ *Note: The specific deadline date and time will be announced for each project.*

---

### ✅ Submission Requirements
- [ ] GitHub repo with all commits from all members
- [ ] `main` branch passes: `npm run typecheck`, `npm run lint`, `npm test`
- [ ] APK (Android) and/or IPA (iOS) built via EAS
- [ ] Demo video (2-3 min) uploaded to shared drive
- [ ] README updated with: group number, member names, GitHub links, video link
- [ ] Peer evaluation forms submitted individually

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for containerized development)
- Expo Go app on your phone (for testing)

### Development with Docker (Recommended)

```bash
# Build and start the development container
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop container
docker-compose down
```

The app will be available at:
- **App in your browser (Web)**: http://localhost:8081 — just open it in Chrome/Firefox/Safari on this machine. The container runs `expo start --web`, so this URL serves the running app (with hot reload).
- **Metro Bundler** (manifest for Expo Go): http://localhost:8081
- **Expo Dev Tools**: http://localhost:8083
- **HMR websocket**: http://localhost:8082

> 📱 **Opening it on a phone / in Expo Go:** `docker-compose.yml` sets `REACT_NATIVE_PACKAGER_HOSTNAME=localhost` so the browser URL works out of the box. `localhost` is only reachable from this machine, so before scanning the QR code from a phone, change that value to this machine's LAN IP (e.g. `192.168.1.50`) and recreate the container with `docker-compose down -v && docker-compose up -d`.

Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on device.

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

## 📁 Project Structure

```
09_React_Native_Capstone_Project_Group_{Number}/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx              # Root layout with providers
│   ├── providers.tsx            # Context providers (Auth, Paper)
│   ├── (auth)/                  # Public routes (no auth required)
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # ✅ Complete - Working login
│   │   ├── register.tsx         # Registration form with validation
│   │   └── styles.ts
│   └── (app)/                   # Protected routes (auth required)
│       ├── _layout.tsx          # Auth guard
│       └── (tabs)/              # Tab navigation
│           ├── _layout.tsx      # Tab configuration
│           ├── home.tsx         # ✅ Recipe discovery
│           ├── search.tsx       # 📝 Recipe search & filters
│           ├── favorites.tsx    # 📝 Favorite recipes
│           └── profile.tsx      # 📝 User profile & settings
├── context/
│   └── AuthContext.tsx          # ✅ Complete auth with useReducer
├── services/
│   └── authApi.ts               # ✅ DummyJSON auth + 📝 register
├── types/
│   └── auth.ts                  # TypeScript interfaces
├── constants/
│   └── theme.ts                 # React Native Paper theme
├── components/                  # Reusable UI components
├── hooks/                       # Custom React hooks
├── utils/                       # Utility functions
├── assets/                      # Images, fonts, etc.
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
├── Dockerfile
├── docker-compose.yml
└── .gitignore
```

## 🔐 Authentication

**Pre-built (Working):**
- Login with username/password → `POST /auth/login`
- Token storage in AsyncStorage
- Auto token refresh on 401
- Protected route guard
- Hydration on app start
- Logout

Registration validates input, creates the account, and signs the user in automatically.
Tokens are persisted with AsyncStorage and refreshed transparently after a 401 response.

## 🍳 Features to Implement

### Core Features (Required)
- [x] **Recipe Discovery** - Browse recipes with loading, refresh, and error states
- [x] **Recipe Search** - Search by query and category
- [x] **Recipe Details** - Full recipe with ingredients, instructions, nutrition
- [x] **Favorites** - Save/remove recipes with AsyncStorage persistence
- [x] **Categories** - Browse by category with recipe counts
- [x] **User Profile** - View/edit profile, stats, settings, logout

### Bonus Features
- [ ] **Meal Planning** - Weekly meal planner
- [ ] **Shopping List** - Generate from selected recipes
- [ ] **Collections** - Custom recipe folders (Breakfast, Dinner, etc.)
- [ ] **Offline Support** - Cache recipes for offline viewing
- [ ] **Share Recipes** - Share via native share sheet
- [ ] **Dark Mode** - Theme switching

## 📚 API Reference

### DummyJSON Recipes API
- **Base URL**: `https://dummyjson.com/recipes`
- **Get All**: `GET /recipes?limit=20&skip=0`
- **Get One**: `GET /recipes/{id}`
- **Search**: `GET /recipes/search?q=chicken`
- **By Category**: `GET /recipes/category/Beef`
- **By Tag**: `GET /recipes/tag/dinner`
- **Random**: `GET /recipes/random`

### DummyJSON Auth API
- **Login**: `POST /auth/login` - `{ username, password, expiresInMins? }`
- **Register**: `POST /auth/register` - `{ firstName, lastName, username, password, email, age?, gender? }`
- **Me**: `GET /auth/me` - Requires Bearer token
- **Refresh**: `POST /auth/refresh` - `{ refreshToken, expiresInMins? }`

## 🎨 UI Components (React Native Paper)

The starter kit uses **React Native Paper v5** with Material Design 3.

Key components used:
- `Button`, `Card`, `TextInput`, `Chip`, `Avatar`, `Badge`
- `List`, `Divider`, `Checkbox`, `IconButton`, `Modal`
- `Snackbar`, `Dialog`, `BottomSheet`, `FAB`

Custom theme in `constants/theme.ts` with warm cooking colors.

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📦 Building for Production

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for Web
npm run web:build
```

## 👥 Group Workflow

1. **Clone this starter kit** to your group repository
2. **Each member** works on different features
3. **Daily standups** - sync on progress
4. **Code reviews** - PR reviews required
5. **Merge to main** - after approval

### Suggested Task Division
- **Member 1**: Search & Filtering, Recipe Details, Categories
- **Member 2**: Favorites & Collections, Profile, Settings
- **Member 3**: Auth Completion (Register), Meal Planning, Shopping List

> 📌 **Group size does not affect your score** — 3 or 4 members, the rubric is graded the same. If your group has 4 members, give **Member 4** the bonus/polish work (Meal Planning, Shopping List, Collections, Dark Mode, Testing).

## 📝 Submission Checklist

- [x] All implementation items completed
- [ ] App runs on iOS & Android
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] README updated with group info
- [ ] Demo video recorded (2-3 min)
- [ ] APK/IPA built and tested
- [ ] Peer evaluation forms submitted

## 🆘 Troubleshooting

### Metro bundler issues
```bash
# Clear cache
npx expo start --clear

# Or in Docker
docker-compose down -v && docker-compose up --build
```

### Port conflict: `port is already allocated`, then crash with `EAI_AGAIN`
**Only one capstone project runs at a time** — 09 and 10 both map Metro to `8081-8083` and `19000-19006`. Starting the second project while the first is up fails with:

```
Bind for 0.0.0.0:8081 failed: port is already allocated
```

That leaves the new container in a half-created state with a broken DNS config, so on the next start Expo CLI dies immediately with:

```
FetchError: request to https://api.expo.dev/... failed, reason: getaddrinfo EAI_AGAIN api.expo.dev
```

Fix:

```bash
# 1. Stop the other project first (run this in the OTHER project's folder)
docker compose stop

# 2. Recreate this project's container cleanly (drops the stale volume + broken network state)
docker compose down -v && docker compose up -d

# 3. Verify
docker compose ps            # STATUS should be "Up"
docker compose logs -f app   # should show the Metro QR banner
```

> 💡 If you add dependencies later, you must also use `down -v` — Compose keeps the old anonymous `node_modules` volume on a plain `up --build`, so the container runs outdated packages.

### Browser shows JSON instead of the app, or HMR never connects
- **`http://localhost:8081/` returns a JSON manifest** → the dev server was started without `--web` (older container). Recreate it: `docker-compose down -v && docker-compose up -d --build`.
- **Blank page / `Unable to resolve module react-native-web`** → the web packages (`react-native-web`, `react-dom`) are missing from `node_modules`. They are declared in `package.json`; rebuild the image and drop the stale volume: `docker-compose down -v && docker-compose up -d --build`.
- **App loads but hot reload doesn't** → `REACT_NATIVE_PACKAGER_HOSTNAME` must be reachable from the browser you're using: `localhost` for this machine, your LAN IP for a phone. Change it in `docker-compose.yml`, then `docker-compose down -v && docker-compose up -d`.
- **`Bind for 0.0.0.0:8081 failed: port is already allocated`** → see the port-conflict fix above; always finish a failed start with `docker-compose down -v && docker-compose up -d`.

### Token refresh not working
- Check `services/authApi.ts` interceptors
- Verify refresh token stored in AsyncStorage
- Check network tab for 401 responses

### Navigation issues
- Ensure all routes defined in file structure
- Check `_layout.tsx` files for proper nesting
- Use `router.push()` for navigation, `router.replace()` for auth flows

## 📄 License

Educational use only - WMAD 302 Capstone Project