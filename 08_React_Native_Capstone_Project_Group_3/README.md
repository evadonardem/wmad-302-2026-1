# React Native Capstone Project: PH Tourist Spot Searcher (Group Project)

## Objective
Collaborate in teams of three to build a theme-responsive **React Native (Expo)** application that maps geographical data of the Philippines and searches for stunning location visuals. You will combine the official **Philippine Standard Geographic Code (PSGC) API** with the **Pexels Image API**, and present everything through **React Native Paper** Material Design 3 components.

The user journey follows a strict chain sequence: **Select Region** → **Select City/Municipality** within that region → Click **Search** to display real-time tourist attraction photos fetched directly from Pexels — optionally narrowing regions first with an **island-group filter**, and revisiting past queries from a **Recent Searches** screen. The app is structured around **Expo Router**: a bottom tab navigator (Search / About) hosts the main screens, each photo card opens a **modal detail route** on a **dynamic path segment** (`/photo/[id]`) carrying its data as **route params**, with a **prev/next viewer**, a **redirect guard**, and **pull-to-refresh** on the results list. The same codebase runs on Android, iOS, and the web.

---

## Technical Specifications & Architecture Flow
1. **Dynamic Regional Fetching:** On initial mount, load all administrative regions of the Philippines via the PSGC API endpoints (`/regions/`).
2. **Dependent Chained Pickers:** When a region is chosen, immediately query that region's precise sub-municipalities and cities (`/regions/{regionCode}/cities-municipalities/`) to populate the nested picker dynamically. React Native has no built-in `<Select>` — you will build chained pickers from Paper `<Menu>` components.
3. **Pexels Image Resolution:** Use the localized text descriptor of the selected municipality to build a focused keyword string (e.g., `"Vigan City tourist spot"`) and fetch high-definition image streams via the Pexels search route.
4. **Environment Variables:** Application access keys must be extracted safely from localized environment files using Expo's standard `EXPO_PUBLIC_` loading mechanics.
5. **Bottom-Tab Navigation:** Register a two-tab navigator (Search, About) with icons via file-based routing.
6. **Modal Detail Route & Params:** Push a `/photo/[id]` route from any gallery card — the id rides in the URL path, the remaining data as search params — read them back with `useLocalSearchParams`, guard against incomplete links with `<Redirect>`, and browse results with a prev/next viewer that `router.replace`s the current entry.
7. **Pull-to-Refresh:** Wrap the dashboard in a `ScrollView` + `RefreshControl` that re-runs the most recent search.
8. **Island-Group Filtering:** Narrow the region menu to Luzon / Visayas / Mindanao with Paper `<Chip>` filters derived from `region.islandGroupCode`.
9. **Recent Searches & Cross-Screen Handoff:** Record every successful search, list it on a pushed History screen, and hand a chosen city back to the dashboard as a route param (`?q=`) that re-triggers the search.

---

## Security & Local Environment Setup
To protect private access tokens from leaking into public code history repositories, this project reads credentials through Expo environment flags:

1. Look at the root folder layout and locate the template file named `.env.example`.
2. Duplicate this file within the root directory and rename the newly created duplicate file to exactly `.env`.
3. Open `.env` and paste your group's private credential token line:
   ```text
   EXPO_PUBLIC_PEXELS_API_KEY=your_actual_private_pexels_api_token_here
   ```
4. Only variables prefixed with `EXPO_PUBLIC_` are exposed to the app — never place raw secrets in source files. Verify that `.env` is recognized by your `.gitignore` configuration before committing anything.

---

## Team Roles & Responsibilities (3 Members)

### **Developer 1: Asynchronous Data & API Service Lead**
* **Core File:** `src/services/geoPhotoService.ts`
* **Deliverables:**
  * Implement Axios asynchronous `GET` calls fetching regions from the PSGC root.
  * Implement dynamic parameter parsing logic fetching specific cities/municipalities from nested paths using string interpolation.
  * Build the Pexels image data handler. Configure custom authorization request header tokens safely (reading `process.env.EXPO_PUBLIC_PEXELS_API_KEY`) and structure clean response arrays containing photo URLs and photographer attribution details.

### **Developer 2: Cascading Form & State Manager**
* **Core File:** `src/components/LocationForm.tsx`
* **Deliverables:**
  * Coordinate the interdependent layout state tracking variables (`regions`, `cities`, `selectedRegion`, `selectedCityName`) plus the island-group filter.
  * Program reactive side-effect hooks (`useEffect`) that clear down-tier selections and trigger new requests to Developer 1's service layer automatically whenever a user shifts the parent region picker.
  * Construct the chained pickers from React Native Paper components (`<Menu>` anchored to `<Button>` triggers with `<Menu.Item>` options) and the `<Chip>` filter row above them.

### **Developer 3: Dashboard Layout & Media Gallery Designer**
* **Core File:** `src/app/(tabs)/index.tsx`, `src/components/MediaGallery.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/photo/[id].tsx`, `src/app/history.tsx`
* **Deliverables:**
  * Assemble the structural layout containers using flexbox row/wrap systems (the React Native answer to web CSS grids) inside a pull-to-refreshable `ScrollView`.
  * Design individual display cards (Paper `<Card>` with `<Card.Cover>`) to present destination photographs dynamically alongside credit references that open the source photographer's profile in the device browser.
  * Configure the bottom tab navigator (Search / About) and push each card's data into the `/photo/[id]` modal detail route; read the params back with `useLocalSearchParams`, guard incomplete links with `<Redirect>`, browse results with the prev/next `router.replace` viewer, render the hero via `expo-image`, and open the generic share sheet with RN's `Share` API.
  * Record successful searches, build the pushed History screen, and hand a chosen city back to the dashboard as a `?q=` route param that re-runs the search.

---

## Grading Rubric & Scoring Mechanics (Group Project)

| Category | Component focus | Max Points | Evaluation Requirements |
| :--- | :--- | :--- | :--- |
| **1. API Service Operations** | `geoPhotoService.ts` | **15 pts** | Async/await execution parsing sub-resource endpoints cleanly, passing security tokens seamlessly, and returning uniform error-resilient models. |
| **2. Chained Lifecycle & Filtering** | `LocationForm.tsx` | **15 pts** | Functional reactive listeners executing dynamic dependent data refreshes without race conditions or state pollution, plus island-group filtering with safe selection resets. |
| **3. Layout & Visual Presentation** | `MediaGallery.tsx` | **12 pts** | Clean interface rendering utilizing Paper components, flexbox wrapping grids, and error/empty boundaries. |
| **4. Integration & State Toggling** | `(tabs)/index.tsx` | **08 pts** | Flawless connectivity wiring the picker outputs to trigger the gallery view alongside functional Dark/Light MD3 palette mapping contexts. |
| **5. Navigation & Screen Flow** | `photo/[id].tsx`, `(tabs)/_layout.tsx` | **10 pts** | A configured tab navigator, a param-carrying guarded modal detail with prev/next browsing, and a graceful generic share integration. |
| **6. History & Cross-Screen Communication** | `history.tsx`, `(tabs)/index.tsx` | **10 pts** | Recorded search history, a pushed history screen with empty state, and a param-based handoff that re-runs the chosen search. |
| **Total Marks** | **All Modules** | **70 pts** | **An end-to-end fully working group application.** |

## Sample Wireframe

```text
+---------------------------------------------------------------------------------------------------+

| [(tabs)/index.tsx]                                                                     [ ☼ / ☾ ]  |
|                                                                                                   |
|   =============================================================================================   |
|   | [Root PaperProvider → SafeAreaView → ScrollView + RefreshControl]                      |   |
|   |                                       🇵🇭 Lakbay PH                                         |   |
|   |       Explore tourist spots across regions, cities, and municipalities in the Philippines |   |
|   |                                                                                           |   |
|   |   +-----------------------------------------------------------------------------------+   |   |
|   |   | [LocationForm.tsx]                                                                |   |   |
|   |   |                                                                                   |   |   |
|   |   |  +------------------------+  +----------------------------+  +-----------------+  |   |   |
|   |   |  | Paper <Menu>           |  | Paper <Menu> (disabled if  |  | Paper <Button>  |  |   |   |
|   |   |  |                        |  | no region code selected)   |  |                 |  |   |   |
|   |   |  |  [ Select Region    ▾ ]|  |  [ Select City/Muni     ▾ ]|  | [🔍 Search]     |  |   |   |
|   |   |  +------------------------+  +----------------------------+  +-----------------+  |   |   |
|   |   +-----------------------------------------------------------------------------------+   |   |
|   =============================================================================================   |
|                                                                                                   |
|   =============================================================================================   |
|   | [MediaGallery.tsx]                                                                        |   |
|   |                                                                                           |   |
|   |   * Fetching State Placeholder: If (loading === true) -> Render <ActivityIndicator />      |   |
|   |   * Empty State Placeholder:    If (photos.length === 0) -> "No tourist spots found"       |   |
|   |                                                                                           |   |
|   |   -------------------------------------------------------------------------------        |   |
|   |   | [View: flexDirection row + flexWrap wrap]                                       |   |   |
|   |   |                                                                                   |   |   |
|   |   |  +-----------------------+   +-----------------------+   +-----------------------+|   |   |
|   |   |  | flexBasis ~30%        |   | flexBasis ~30%        |   | flexBasis ~30%        ||   |   |
|   |   |  |                       |   |                       |   |                       ||   |   |
|   |   |  |  +-----------------+  |   |  +-----------------+  |   |  +-----------------+  ||   |   |
|   |   |  |  | Paper <Card>    |  |   |  | Paper <Card>    |  |   |  | Paper <Card>    |  ||   |   |
|   |   |  |  |                 |  |   |  |                 |  |   |  |                 |  ||   |   |
|   |   |  |  |  <Card.Cover>   |  |   |  |  <Card.Cover>   |  |   |  |  <Card.Cover>   |  ||   |   |
|   |   |  |  |  Pexels Photo   |  |   |  |  Pexels Photo   |  |   |  |  Pexels Photo   |  ||   |   |
|   |   |  |  |  imageUrl       |  |   |  |  imageUrl       |  |   |  |  imageUrl       |  ||   |   |
|   |   |  |  |                 |  |   |  |                 |  |   |  |                 |  ||   |   |
|   |   |  |  |  <Card.Content> |  |   |  |  <Card.Content> |  |   |  |  <Card.Content> |  ||   |   |
|   |   |  |  |  📸 Captured by |  |   |  |  📸 Captured by |  |   |  |  📸 Captured by |  ||   |   |
|   |   |  |  |  Pressable →    |  |   |  |  Pressable →    |  |   |  |  Pressable →    |  ||   |   |
|   |   |  |  |  Browser App    |  |   |  |  Browser App    |  |   |  |  Browser App    |  ||   |   |
|   |   |  |  +-----------------+  |   |  +-----------------+  |   |  +-----------------+  ||   |   |
|   |   |  +-----------------------+   +-----------------------+   +-----------------------+|   |   |
|   |   |                                                                                   |   |   |
|   |   -------------------------------------------------------------------------------        |   |
|   =============================================================================================   |
|   | [Bottom Tab Bar]                                                       [ 🔍 Search | ⓘ About ] |
|   =============================================================================================   |
+---------------------------------------------------------------------------------------------------+

| [photo/[id].tsx — pushed as a Stack modal over the tabs]                                         |
|   =============================================================================================   |
|   | Tourist Spot                                                          [ ← Back ]              |
|   |                                    (header title: "By {photographer}" once params wire)        |
|   |                                                                                               |
|   |  +---------------------------------------------------------------------------------------+   |
|   |  | <expo-image hero>  (source: imageUrl search param)                                     |   |
|   |  +---------------------------------------------------------------------------------------+   |
|   |                                                                                               |   |
|   |  [ ◀ ]              📸 Captured by {photographer}                          [ ▶ ]           |   |
|   |                          (prev/next — router.replace to /photo/[id] of neighbor)              |   |
|   |                                                                                               |   |
|   |  [ 🔗 Visit photographer profile ]        [ 📤 Share this spot — Share.share() ]             |   |
|   =============================================================================================   |
+---------------------------------------------------------------------------------------------------+

| [history.tsx — pushed from the Search header's history button]                                   |
|   =============================================================================================   |
|   | Recent Searches                                                                   [ ← Back ] |
|   |                                                                                               |   |
|   |  Tap a city to jump back into that search.                                                   |   |
|   |  [ 🏙️ Baguio City ]   ← onPress → router.navigate({ pathname: '/', params: { q: city } })     |
|   |  [ 🏙️ Vigan City ]                                                                               |
|   |  ... (empty state: "No searches yet — run a search on the Search tab first.")                |   |
|   =============================================================================================   |
+---------------------------------------------------------------------------------------------------+
```

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create your `.env` file (see Security setup above), then start the app

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

   If port 8081 is already taken on your machine, create a `.env` entry with `EXPO_PORT=3000` (or any free port) — both the container and the host mapping will use it.

### Where to work

| File | Role | Assignment TODOs |
| :--- | :--- | :--- |
| `src/services/geoPhotoService.ts` | Developer 1 | TODO 1.1 – 1.4 |
| `src/components/LocationForm.tsx` | Developer 2 | TODO 2.1 – 2.9 |
| `src/components/MediaGallery.tsx` | Developer 3 | TODO 3.1 – 3.6, 4.3 |
| `src/app/(tabs)/index.tsx` | Developer 3 | TODO 3.7 – 3.8, 4.6, 5.1, 5.4 |
| `src/app/(tabs)/_layout.tsx` | Developer 3 | TODO 4.1 – 4.2 |
| `src/app/photo/[id].tsx` | Developer 3 | TODO 4.4, 4.5, 4.7, 4.8 |
| `src/app/(tabs)/about.tsx` | Developer 3 | TODO 4.9 |
| `src/app/history.tsx` | Developer 3 | TODO 5.2 – 5.3 |

### Run checks before submitting

```bash
npx tsc --noEmit
npx expo lint
```

## Learn more

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [React Native Paper](https://callstackincubator.github.io/react-native-paper/): Material Design 3 components for React Native.
- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/): How `EXPO_PUBLIC_` variables are loaded.

---

## Appendix: Reference API Payload Formats

To assist with testing and structuring data mappings, refer to the verified signatures and structural payload shapes for both integrated REST endpoints below:

### 1. PSGC Geographic API (Philippine Standard Geographic Code)

#### A. Fetching Regions List
* **Endpoint:** `GET https://psgc.gitlab.io/api/regions/`
* **Response Payload Shape (`Array<Object>`):**
```json
[
  {
    "code": "140000000",
    "name": "Cordillera Administrative Region (CAR)",
    "regionName": "Cordillera Administrative Region",
    "islandGroupCode": "luzon",
    "psgcCode": "140000000"
  }
]
```

#### B. Fetching Cities & Municipalities for a Selected Region
* **Endpoint:** `GET https://psgc.gitlab.io/api/regions/{regionCode}/cities-municipalities/`
* **Example Query (CAR Region `140000000`):** `GET https://psgc.gitlab.io/api/regions/140000000/cities-municipalities/`
* **Response Payload Shape (`Array<Object>`):**
```json
[
  {
    "code": "141102000",
    "name": "City of Baguio",
    "oldName": "",
    "isCapital": false,
    "isCity": true,
    "isMunicipality": false,
    "provinceCode": "141100000",
    "districtCode": false,
    "regionCode": "140000000",
    "islandGroupCode": "luzon",
    "psgc10DigitCode": "1430300000"
  }
]
```

---

### 2. Pexels Media Search API

* **Endpoint:** `GET https://pexels.com{keyword}&per_page=12`
* **Required Headers:** `Authorization: YOUR_API_KEY`
* **Example Query:** `GET https://pexels.comBaguio%20City%20tourist%20spot&per_page=12`
