# Project 09: Cookbook Mobile App (Group 7)

A full-stack React Native & Expo Router cookbook application powered by the DummyJSON API, featuring JWT authentication, recipe discovery, multi-criteria search & filtering, persistent favorites with personal notes, and user profile management.

## Features
- **Authentication**: Login, Registration with validation, JWT token refresh interceptors, and persistent sessions.
- **Recipe Discovery & Search**: Paginated recipe feed, debounced search, cuisine/meal-type/difficulty filters, and Categories grid.
- **Recipe Details**: Scaled ingredient servings, step-by-step cooking instructions, nutrition info, and favorites toggle.
- **Favorites & Profile**: Persistent favorites with tab badge count, personal cooking notes, and profile editing (`PUT /users/{id}`).

## Setup & Verification
- Install dependencies: `npm install`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Run tests: `npm test`
- Start web app: `npm run web`
