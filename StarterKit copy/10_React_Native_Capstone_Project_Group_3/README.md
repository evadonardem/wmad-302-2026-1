# 10 React Native Capstone Project - Marketplace App

A React Native + Expo + React Native Paper e-commerce application (Lazada/Shopee clone) using the [DummyJSON Products API](https://dummyjson.com/docs/products) and [Carts API](https://dummyjson.com/docs/carts).

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
| Product Discovery (Home) | 4 | Pagination, loading states, error handling, images load |
| Product Search & Filters | 6 | Query search, category/brand/price-range filters, sort options, debounced input |
| Product Detail Screen | 6 | Image gallery, specs, rating, reviews, share, add-to-cart from detail |
| Categories Screen | 4 | Grid layout, category counts, navigation to filtered results |
| Shopping Cart | 7 | Add/remove/update quantity, Context + AsyncStorage persistence, badge counts, empty state |
| Checkout | 5 | Order placement via `POST /carts/add`, form validation, confirmation state |
| Order History | 4 | `GET /carts/user/{id}`, order cards, order detail view |
| User Profile | 4 | Edit profile (PUT /users/{id}), addresses, settings, logout |

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
| Code Comments | 1 | Complex logic documented, TODO comments resolved |

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
10_React_Native_Capstone_Project_Group_3/
├── app/                          # Expo Router file-based routing (every file here is a route)
│   ├── _layout.tsx              # Root layout: providers, error boundary, splash screen
│   ├── index.tsx                # "/" → /home or /login
│   ├── (auth)/                  # Public routes (signed-in users are redirected to /home)
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # Login + demo account
│   │   └── register.tsx         # Validated sign-up with auto-login
│   └── (app)/                   # Protected routes (auth guard)
│       ├── _layout.tsx          # Auth guard + stack screens
│       ├── (tabs)/              # Shop · Search · Categories · Cart (badge) · Profile
│       ├── product/[id].tsx     # Product detail: gallery, specs, reviews, share, add to cart
│       ├── checkout.tsx         # Shipping form, payment, POST /carts/add, confirmation
│       ├── orders/              # Order history + order detail
│       ├── wishlist.tsx
│       ├── edit-profile.tsx     # PUT /users/{id}
│       ├── addresses.tsx        # Address CRUD + default address
│       ├── payment-methods.tsx  # Cards (Luhn-validated, masked) + e-wallets
│       └── settings.tsx
├── context/                     # Providers, Settings (theme/language), Auth, Cart, Wishlist, Activity + pure reducers
├── services/                    # authApi, productApi, userApi, orderService, notifications
├── hooks/                       # useThemedStyles, useGridColumns, useAsyncStorage, useDebounce, useInfiniteScroll, useNetworkStatus
├── components/                  # ProductCard, EmptyState, Skeletons, ConfirmDialog, LivelyBackground, SeasonHero, SeasonParticles, SeasonBanner, Confetti…
├── styles/                      # Style factories per screen: makeXStyles(palette) (kept outside app/ so they aren't routes)
├── i18n/                        # English + Filipino translations
├── types/                       # auth, product, account interfaces
├── utils/                       # storage, cart math & coupons, orders, validation, formatting, errors
├── constants/                   # Palettes (light/dark × 8 themes), season decorations, Paper + navigation themes, category icons
└── __tests__/                   # Jest unit + integration tests
```

## 🔐 Authentication

- **Login** → `POST /auth/login` (try the demo account `emilys` / `emilyspass`)
- **Register** → validated form (inline errors, password confirmation, terms checkbox) then auto-login
- **Session storage** → user + tokens persisted in AsyncStorage (works on iOS, Android and web) and cached in memory for the axios interceptor
- **Token refresh** → a 401 triggers one shared `POST /auth/refresh` and the request is retried; if the refresh fails the session is cleared and the auth guard redirects to login
- **Hydration** → on launch the stored session is verified with `GET /auth/me` (offline launches keep the cached user)
- **Protected routes** → `app/(app)/_layout.tsx` redirects signed-out users to `/login`

> ⚠️ **DummyJSON quirks handled in code**
> - `/auth/login` returns `accessToken` (not `token`); `authApi.login` normalizes it.
> - There is no `/auth/register` endpoint. Registration calls `POST /users/add`, which *simulates* creating the user but doesn't save it, so `/auth/login` rejects the new credentials. The app then starts a **device-only session** for the new account (`isLocalSession`). Use the demo account to see real order history from the API.

## 🛒 Features

### Core Features
- [x] **Product Discovery** - Infinite-scroll product grid, pull-to-refresh, skeletons, error/retry
- [x] **Product Search** - Debounced query, category / brand / price-range filters, 6 sort options, pagination
- [x] **Product Details** - Image gallery, specs, rating, reviews, share, quantity + add-to-cart / buy now
- [x] **Categories** - Grid of all categories with product counts → filtered search
- [x] **Shopping Cart** - Context + useReducer, AsyncStorage persistence, tab badge, stock limits, empty state
- [x] **Checkout** - Validated shipping form, saved addresses, payment selection, `POST /carts/add`, confirmation
- [x] **Order History** - In-app orders + `GET /carts/user/{id}`, order detail view
- [x] **User Profile** - Edit profile (`PUT /users/{id}`), addresses, payment methods, settings, logout

### Bonus Features
- [x] **Wishlist** - Save products for later (persisted)
- [x] **Coupons/Discounts** - `SAVE10` (10% off), `WELCOME5` ($5 off over $25), `BIGSALE20` (20% off over $200), `XMAS25` (25% off over $100)
- [x] **Product Reviews** - Read reviews and write your own (star rating + comment, saved on the device)
- [x] **Flash Deals** - Biggest discounts with a countdown to midnight
- [x] **Notifications** - Local "order placed" notification + optional daily 9 AM deal reminder (iOS/Android; `expo-notifications`). Tapping one opens the related screen
- [x] **Dark Mode** - System / Light / Dark in Settings; every screen reads colors from the active palette
- [x] **Multi-language** - English and Filipino (`i18n/translations.ts`)

### Extra Features
- [x] **🌈 Lively pink theme (default)** - Pink primary with yellow, green and sky-blue accents, floating color blobs behind the main screens (Settings → Lively background, static under Reduce Motion) and falling confetti on Home
- [x] **🎄 Seasonal themes** - Settings → Seasonal theme (preview cards): Auto, Lively, Christmas, Winter, Spring, Summer, Rainy season, Autumn, Halloween. Each theme recolors the whole app (tinted background, theme-colored tab bar with an accent stripe, screen headers, Search/Categories/Profile headers, card borders) and adds a Home hero with a seasonal greeting and emoji scene (🎃🪦👻, 🌲⛄🏔️ …), a wallpaper of season emoji, season particles (snow, petals, sun bubbles, rain, leaves, bats), a banner in the theme's second color, and "pick" ribbons on top-rated products (🎃 Spooky pick, ❄️ Cozy pick …). Auto = Christmas Nov 1 – Jan 6, Halloween in October, Lively otherwise
- [x] **🎁 Christmas extras** - Countdown to Dec 25, XMAS25 code, "Gift idea" ribbons, gift cart icon, festive empty states, confetti on order confirmation
- [x] **Gift wrapping** at checkout (+$2.99) with a gift message, and a **Gifts under $25** shortcut
- [x] **Responsive grid** - 2 columns on phones, 3–4 on tablets, 5 on wide screens
- [x] **Deep links** - `marketplace://product/12` (or `/product/12` on web) opens a product; signed-out users log in and land back on it. Shared product links use these URLs
- [x] **Order tracking** - Placed → Packed → Shipped → Delivered timeline (simulated from the order time) and **Buy Again**
- [x] **Recently viewed**, **search history** and **compare** (up to 3 products side by side, best values highlighted)
- [x] **Offline banner** (`@react-native-community/netinfo`)
- [x] Animations (snow, confetti) are skipped when the device's **Reduce Motion** setting is on

### Engagement & Shopping Extras
- [x] **🎁 Rewards** (Profile → Rewards, and the strip under the Home hero) - daily check-in streak, seasonal points (❄️ Snowflakes, 🎃 Candies …), a **daily surprise** box you tap three times to open, points redeemable for coupons, and 8 **badges**. Reward-only coupons (`POINTS5`, `POINTS15`, `LUCKY12`, `ADVENT20`) work in the cart only after they are unlocked
- [x] **🎄 Advent calendar** (Dec 1–24) - 24 flipping doors with points, coupons or deals; door 1 can be opened early as a sneak peek
- [x] **💝 Gift lists** - named lists ("For Mom", "Secret Santa") with an emoji and a budget progress bar; add products from the 🎁 button on any product page
- [x] **🔗 Shareable cart & gift-list links** - `marketplace://shared?kind=cart&items=12x2,5x1` opens a "Shared with you" screen with **Add all to cart** (the link survives the login redirect)
- [x] **📸 Product photos** - swipe gallery plus full-screen viewer with **pinch / double-tap zoom**; **Frequently bought together** (with "Add all") and **Similar products**; side-by-side layout on tablets / wide screens
- [x] **🔎 Filter sheet** - price (in $ or ₱), minimum rating, in-stock only and brand, in a bottom sheet
- [x] **🚚 Delivery day & time slot** at checkout, an illustrated **delivery route** on the order page, and a **PDF receipt** (expo-print + expo-sharing; print dialog on web)
- [x] **₱ Philippine peso** display (Settings → Currency, demo rate $1 = ₱58) alongside GCash / Maya / cash on delivery
- [x] **🔐 Fingerprint / Face ID** confirmation before placing an order (expo-local-authentication; mobile only, optional)
- [x] **📶 Offline browsing** - product lists, product pages and categories you have opened are cached and shown when offline

### Design Extras
- [x] **Theme fonts** - each season has its own heading font (Fredoka, Mountains of Christmas, Sniglet, Pacifico, Lilita One, Comfortaa, Amatic SC, Creepster)
- [x] **Fly-to-cart animation** with haptics and a bouncing cart tab; optional **theme sounds** (Settings → Theme sounds; generated by `scripts/generate-sounds.js`)
- [x] **Themed empty & loading states** - seasonal emoji scenes, captions and a spinning season emoji instead of the plain spinner
- [x] **Onboarding carousel** on first launch, ending with the theme picker (Settings → Replay the intro)
- [x] **Theme-switch ripple** in the new theme color, **frosted-glass cards** (expo-blur) on the new screens
- [x] **Accessibility** - every palette is tested for WCAG AA contrast (`__tests__/a11y.test.ts`); decorations are hidden from screen readers; animations respect Reduce Motion

Free shipping applies to orders of $50+ (after product discounts); otherwise shipping is $4.99.

## 📚 API Reference

### DummyJSON Products API
- **Base URL**: `https://dummyjson.com/products`
- **Get All**: `GET /products?limit=20&skip=0&sortBy=price&order=asc`
- **Get One**: `GET /products/{id}`
- **Search**: `GET /products/search?q=iphone`
- **Categories**: `GET /products/categories` → `[{ slug, name, url }]` (plain names: `/products/category-list`)
- **By Category**: `GET /products/category/smartphones`
- **Counts per category**: `GET /products?limit=0&select=category` (one request, counted on the client)
- **By Brand**: no endpoint exists — brand filtering is done on the client

### DummyJSON Carts API
- **Get User Carts**: `GET /carts/user/{userId}`
- **Get Cart**: `GET /carts/{id}`
- **Add Cart**: `POST /carts/add` - `{ userId, products: [{ id, quantity }] }` (simulated; orders are also saved on the device)
- **Update Cart**: `PUT /carts/{id}` - `{ products, merge? }`
- **Delete Cart**: `DELETE /carts/{id}`

### DummyJSON Auth & Users API
- **Login**: `POST /auth/login` - `{ username, password, expiresInMins? }`
- **Register**: `POST /users/add` - `{ firstName, lastName, username, password, email, age?, gender? }` (simulated)
- **Me**: `GET /auth/me` - Requires Bearer token
- **Refresh**: `POST /auth/refresh` - `{ refreshToken, expiresInMins? }`
- **Update profile**: `PUT /users/{id}` (simulated)

## 🎨 UI Components (React Native Paper)

The starter kit uses **React Native Paper v5** with Material Design 3.

Key components used:
- `Button`, `Card`, `TextInput`, `Chip`, `Avatar`, `Badge`
- `List`, `Divider`, `Checkbox`, `IconButton`, `Modal`
- `Snackbar`, `Dialog`, `BottomSheet`, `FAB`
- `Banner`, `Chip`, `HelperText`, `ProgressBar`

Custom theme in `constants/theme.ts`, built from the active palette in `constants/palettes.ts` (default: pink primary; yellow, green and sky-blue accents).

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

**UI tests (Maestro):** flows in `.maestro/` sign in, add to cart, switch theme and check in. Install [Maestro](https://maestro.mobile.dev), start an emulator with a dev build, then run `maestro test .maestro/`.

**CI:** `.github/workflows/capstone-group3.yml` (repository root) runs typecheck, lint, tests with coverage and a web build whenever this folder changes.

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
- **Member 1**: Search & Filtering, Product Details, Categories
- **Member 2**: Cart & Checkout, Order History, Coupons/Discounts
- **Member 3**: Auth Completion (Register), Profile, Addresses, Reviews & UI Polish

> 📌 **Group size does not affect your score** — 3 or 4 members, the rubric is graded the same. If your group has 4 members, give **Member 4** the bonus/polish work (Wishlist, Coupons, Flash Deals, Dark Mode, Testing).

## 📝 Submission Checklist

- [ ] All TODO items completed
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

### Cart persistence
- Check AsyncStorage key: `cart`
- Verify cart context updates trigger persistence
- Test offline add-to-cart flow

## 📄 License

Educational use only - WMAD 302 Capstone Project