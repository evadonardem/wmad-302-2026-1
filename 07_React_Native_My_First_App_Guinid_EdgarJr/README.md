# Project Assignment: Dynamic Quote Generator (React Native + Expo)

## Objective
Build a dynamic, theme-responsive quote generator connected to an external REST API. You will use **React state management hooks**, lifecycle events, mutable references, and modular service utilities to handle async networking alongside a **React Native** interface with **bottom-tab navigation** (Home / Favorites / Settings) that runs on Android, iOS, and the web.

---

## Technical Specifications & Checklist
To achieve full credit, your application must successfully execute the following workflows:
* **Initial Lifecycle Load:** Fetch a random starting quote and populate the category filter chips concurrently on component mount.
* **Reference-Tracked Filtering:** Use a mutable reference to track the selected filter tag so quotes are requested with the active criteria without unnecessary component re-renders.
* **Conditional UI Mapping:** Program lists to map datasets dynamically onto chip, text, and settings-row elements while applying state-based structural colors.
* **Asynchronous Integration:** Interface with backend network endpoints safely using async/await syntax patterns and fallback exception shields.
* **Dynamic Theme Control:** Implement system-wide dark/light mode switches mapped seamlessly across a custom theme provider wrapper.
* **Bottom-Tab Navigation:** Register a three-tab navigator (Home, Favorites, Settings) with icons via file-based routing.
* **Favorites & Router:** Save the current quote into a favorites list, render it on the Favorites tab, and jump to it programmatically with the Expo Router.

---

## Grading Rubric & Scoring Mechanics

| Category | Points | Evaluation Requirements |
| :--- | :--- | :--- |
| **1. Hook Configuration & Ref Control** | **10 pts** | Accurate initialization of states for current items, selection properties, arrays, and a `useRef` reference tracking the active tag. |
| **2. Lifecycle Side Effects** | **10 pts** | Proper utilization of dependency tracking hooks executing data population functions once when component mounts. |
| **3. Interface Component Data Mapping** | **12 pts** | Valid implementation of array mapping structures transforming objects cleanly into tag chips, text labels, and filter chip options. |
| **4. Asynchronous Service Operations** | **10 pts** | Correct runtime string interpolation, execution of asynchronous GET operations via Axios, and resilient catch fallback block triggers. |
| **5. Core Layout & Theme Toggling Logic** | **08 pts** | Integration of a theme state listener configuring light/dark style contexts dynamically across child modules. |
| **6. Bottom Navigation & Favorites** | **10 pts** | A configured bottom tab navigator with three icon-labeled screens, a context-driven favorites list, and a favorite action wired to programmatic routing. |
| **Total Marks** | **60 pts** | **A fully operational application meeting all architectural and behavioral evaluation metrics.** |

---

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   Or with Docker (then open [http://localhost:8081](http://localhost:8081)):

   ```bash
   docker compose up
   ```

   To test on a physical phone with Expo Go, create a `.env.local` file next to `docker-compose.yml` with your machine's LAN IP so Metro advertises a reachable host:

   ```
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.31.100
   ```

   If port 8081 is already taken on your machine, create a `.env` file with `EXPO_PORT=3000` (or any free port) — both the container and the host mapping will use it.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo
- the web by pressing `w`

You can start developing by editing the files inside the **src** directory (`src/app/`, `src/components/`, `src/services/`). This project uses [file-based routing](https://docs.expo.dev/router/introduction) — every file under `src/app/(tabs)/` is a screen.

### Where to work

| File | Assignment TODOs |
| :--- | :--- |
| `src/components/QuoteOfTheDay.tsx` | TODO 1 – 11, 24 |
| `src/components/GeneralSettings.tsx` | TODO 12 |
| `src/app/_layout.tsx` | TODO 13, 14, 16 |
| `src/app/(tabs)/settings.tsx` | TODO 15 |
| `src/services/quoteService.ts` | TODO 17 – 20 |
| `src/app/(tabs)/_layout.tsx` | TODO 21 – 22 |
| `src/app/(tabs)/favorites.tsx` | TODO 23 |

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

### Run checks before submitting

```bash
npx tsc --noEmit
npx expo lint
```

## Learn more

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
