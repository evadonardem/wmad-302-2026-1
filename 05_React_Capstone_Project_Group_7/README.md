# React Capstone Project: PH Tourist Spot Searcher

## Objective
Collaborate in teams of three to build a theme-responsive web application that maps geographical data of the Philippines and searches for stunning location visuals. You will combine the official **Philippine Standard Geographic Code (PSGC) API** with the **Pexels Image API**. 

The user journey follows a strict chain sequence: **Select Region** → **Select City/Municipality** within that region → Click **Search** to display real-time tourist attraction photos fetched directly from Pexels.

---

## Technical Specifications & Architecture Flow
1. **Dynamic Regional Fetching:** On initial mount, load all administrative regions of the Philippines via the PSGC API endpoints (`/regions.json`).
2. **Dependent Chained Dropdowns:** When a region is chosen, immediately query that region's precise sub-municipalities and cities (`/regions/{regionCode}/cities-municipalities.json`) to populate the nested picker dynamically.
3. **Pexels Image Resolution:** Use the localized text descriptor of the selected municipality to build a focused keyword string (e.g., `"Vigan City tourist spot"`) and fetch high-definition image streams via the Pexels search route.
4. **Environment Variables:** Application access keys must be extracted safely from localized environment files using standard framework loading mechanics.

---

## Security & Local Environment Setup
To protect private access tokens from leaking into public code history repositories, this project reads credentials through secure Vite environment flags:

1. Look at the root folder layout and locate the template file named `.env.example`.
2. Duplicate this file within the root directory and rename the newly created duplicate file to exactly `.env.local`.
3. Open `.env.local` and paste your group's private credential token line:
   ```text
   VITE_PEXELS_API_KEY=your_actual_private_pexels_api_token_here
   ```
4. Verify that `.env.local` is recognized by your `.gitignore` configuration rule parameters before committing anything.

---

## Team Roles & Responsibilities (3 Members)

### **Developer 1: Asynchronous Data & API Service Lead**
* **Core File:** `src/services/geoPhotoService.js`
* **Deliverables:** 
  * Implement Axios asynchronous `GET` calls fetching regions from the PSGC root.
  * Implement dynamic parameter parsing logic fetching specific cities/municipalities from nested paths using string interpolation.
  * Build the Pexels image data handler. Configure custom authorization request header tokens safely and structure clean response arrays containing photo URLs and photographer attribution details. 

### **Developer 2: Cascading Form & State Manager**
* **Core File:** `src/components/LocationForm.jsx`
* **Deliverables:**
  * Coordinate the interdependent layout state tracking variables (`regions`, `cities`, `selectedRegion`, `selectedCity`).
  * Program reactive side-effect hooks (`useEffect`) that clear down-tier selections and trigger new requests to Developer 1's service layer automatically whenever a user shifts the parent region dropdown.
  * Construct form elements matching MUI specifications (`<Select>`, `<FormControl>`, `<InputLabel>`).

### **Developer 3: Dashboard Layout & Media Gallery Designer**
* **Core File:** `src/App.jsx`, `src/components/MediaGallery.jsx`
* **Deliverables:**
  * Assemble the structural grid containers utilizing MUI responsive layout systems (`<Grid2>` or layout boxes).
  * Design individual display cards (`<Card>`, `<CardMedia>`) to present destination photographs dynamically alongside credit references linked directly to source photographers.
  * Integrate the system-wide Dark/Light state switcher and pass global callback actions down to execute the search workflow on submit.

---

## Grading Rubric & Scoring Mechanics (Group Project)

| Category | Component focus | Max Points | Evaluation Requirements |
| :--- | :--- | :--- | :--- |
| **1. API Service Operations** | `geoPhotoService.js` | **15 pts** | Async/await execution parsing sub-resource endpoints cleanly, passing security tokens seamlessly, and returning uniform error-resilient models. |
| **2. Chained Lifecycle Logic** | `LocationForm.jsx` | **15 pts** | Functional reactive listeners executing dynamic dependent data refreshes without race conditions or state pollution when parent metrics alter. |
| **3. Layout & Visual Presentation** | `MediaGallery.jsx` | **12 pts** | Clean interface rendering utilizing MUI layout components, fluid grids, and error/empty boundaries. |
| **4. Integration & State Toggling** | `App.jsx` | **08 pts** | Flawless connectivity wiring the dropdown outputs to trigger the gallery view alongside functional Dark/Light palette mapping contexts. |
| **Total Marks** | **All Modules** | **50 pts** | **An end-to-end fully working group application.** |

## Sample Wireframe

```text
+---------------------------------------------------------------------------------------------------+

| [App.jsx]                                                                         [ Light/Dark ☼ ]|
|                                                                                                   |
|   =============================================================================================   |
|   | [Paper]                                                                                   |   |
|   |                                       🇵🇭 Lakbay PH                                         |   |
|   |       Explore tourist spots across regions, cities, and municipalities in the Philippines |   |
|   |                                                                                           |   |
|   |   +-----------------------------------------------------------------------------------+   |   |
|   |   | [LocationForm.jsx]                                                                |   |   |
|   |   |                                                                                   |   |   |
|   |   |  +------------------------+  +----------------------------+  +-----------------+  |   |   |
|   |   |  | FormControl            |  | FormControl (disabled if   |  | Button          |  |   |   |
|   |   |  |                        |  | no region code selected)   |  |                 |  |   |   |
|   |   |  | [ Select Region     v ]|  | [ Select City/Muni      v ]|  | [🔍 Search]     |  |   |   |
|   |   |  +------------------------+  +----------------------------+  +-----------------+  |   |   |
|   |   +-----------------------------------------------------------------------------------+   |   |
|   =============================================================================================   |
|                                                                                                   |
|   =============================================================================================   |
|   | [MediaGallery.jsx]                                                                        |   |
|   |                                                                                           |   |
|   |   * Fetching State Placeholder: If (loading === true) -> Render MUI Skeletons             |   |
|   |   * Empty State Placeholder:    If (photos.length === 0) -> "No tourist spots found"       |   |
|   |                                                                                           |   |
|   |   -------------------------------------------------------------------------------------   |   |
|   |   | [Grid container spacing={3}]                                                      |   |   |
|   |   |                                                                                   |   |   |
|   |   |  +-----------------------+   +-----------------------+   +-----------------------+|   |   |
|   |   |  | [Grid item]           |   | [Grid item]           |   | [Grid item]           ||   |   |
|   |   |  | md={4} sm={6} xs={12} |   | md={4} sm={6} xs={12} |   | md={4} sm={6} xs={12} ||   |   |
|   |   |  |                       |   |                       |   |                       ||   |   |
|   |   |  |  +-----------------+  |   |  +-----------------+  |   |  +-----------------+  ||   |   |
|   |   |  |  | Card            |  |   |  | Card            |  |   |  | Card            |  ||   |   |
|   |   |  |  |                 |  |   |  |                 |  |   |  |                 |  ||   |   |
|   |   |  |  |  [CardMedia]    |  |   |  |  [CardMedia]    |  |   |  |  [CardMedia]    |  ||   |   |
|   |   |  |  |  Pexels Photo   |  |   |  |  Pexels Photo   |  |   |  |  Pexels Photo   |  ||   |   |
|   |   |  |  |  imageUrl       |  |   |  |  imageUrl       |  |   |  |  imageUrl       |  ||   |   |
|   |   |  |  |                 |  |   |  |                 |  |   |  |                 |  ||   |   |
|   |   |  |  |  [CardContent]  |  |   |  |  [CardContent]  |  |   |  |  [CardContent]  |  ||   |   |
|   |   |  |  |  📸 Captured by|  |   |  |  📸 Captured by|  |   |  |  📸 Captured by |  ||   |   |
|   |   |  |  |  Link -> Profile|  |   |  |  Link -> Profile|  |   |  |  Link -> Profile|  ||   |   |
|   |   |  |  +-----------------+  |   |  +-----------------+  |   |  +-----------------+  ||   |   |
|   |   |  +-----------------------+   +-----------------------+   +-----------------------+|   |   |
|   |   |                                                                                   |   |   |
|   |   -------------------------------------------------------------------------------------   |   |
|   =============================================================================================   |
+---------------------------------------------------------------------------------------------------+
```
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