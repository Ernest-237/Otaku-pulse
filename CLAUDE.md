# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Otaku Pulse is a French/English anime-culture platform for Cameroon: an event-booking/reservation service, a merch boutique, a blog, a "Fandom" (Otaku Fest West) mini-games/cosplay-contest module, and a full manga-reading platform (publishing, chapters, reading progress, subscriptions, and an in-app coin economy for unlocking premium chapters). It is two independent apps in one repo: a Vite/React SPA frontend (`src/`) and an Express/Sequelize/PostgreSQL API backend (`server/`), each with its own `package.json` and `node_modules`.

## Commands

Frontend (run from repo root):
- `npm run dev` — start Vite dev server (default port 5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build

Backend (run from `server/`):
- `npm run dev` — start API with nodemon (auto-reload)
- `npm start` — start API with plain node (used in production, entry `start.js` → `index.js`)
- `npm run db:seed` — seed the database (`utils/seed.js`)
- `npm run db:reset` — wipe and reseed (`utils/seed.js --reset`)

There are no configured lint/test scripts in either `package.json` (an `eslint.config.js` exists at the root but is not wired to an npm script — run `npx eslint .` directly if needed). There is no test suite in this repo currently.

The backend requires a `server/.env` with at least `DATABASE_URL` (PostgreSQL/Render), `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CLIENT_URL`; Cloudinary/Stripe/nodemailer credentials are needed for upload, payment, and email features respectively.

## Architecture

### Backend (`server/`, CommonJS)

- `index.js` — app entry: security middleware (helmet, CORS allowlist, rate limiting), mounts every route module under `/api/*`, health check at `/api/health`, and in production serves the built frontend (`../dist`) with an SPA fallback.
- `config/database.js` — single Sequelize instance connected to Postgres over SSL (Render-hosted).
- `models/index.js` — **all** Sequelize models and associations live in this one file (no per-model files). It's organized in blocks: core commerce (User, Product, Order, Event, Contact, Wishlist, Newsletter, Supplier, HeroConfig, MembershipRequest), then "MANGA PLATFORM" (Manga, Chapter, ReadingProgress, LibraryItem, ChapterView, Subscription, PublisherApplication, MangaComment, MangaRating, MangaFollow), then "SYSTÈME DE COINS" (CoinWallet, CoinTransaction, CoinPurchaseRequest, ChapterUnlock), then "FANDOM" (CosplayEntry, CosplayVote, QuizQuestion, QuizScore, GameScore). All associations are declared at the bottom of the file, grouped the same way. `syncDatabase()` runs `sequelize.sync({ alter: true })` on boot (no migration files — schema changes happen by editing model definitions).
- `routes/` — one Express router file per resource, mounted directly in `index.js` (e.g. `routes/coins.js` → `/api/coins`, `routes/adminManga.js` → `/api/admin/manga`). Admin-only concerns are split into their own router files (`admin.js`, `adminManga.js`, `adminCoins.js`) rather than nested inside the public resource router.
- `middleware/auth.js` — JWT auth: `protect` (required), `optionalAuth` (attaches `req.user` if a valid token is present, else continues), `restrictTo(...roles)` (role gate, use after `protect`), and `generateTokens(userId)` for access/refresh token pairs. Roles are `user`, `publisher`, `admin`, `superadmin`.
- Images (product photos, manga covers/pages, hero backgrounds, cosplay photos) are stored as base64 (`*Data`/`*Mime` column pairs) directly in Postgres rather than as files/URLs to an object store — `express.json` limit is raised to 20mb to accommodate this.
- The coin economy (`routes/coins.js`, `routes/adminCoins.js`) is a manually-reconciled Mobile Money flow: users submit a `CoinPurchaseRequest` with a transaction ID, an admin approves/rejects it (`adminCoins.js`), and only then are coins credited via `CoinTransaction` + `CoinWallet.balance`. Coin packs and payment numbers are defined server-side (`COIN_PACKS`, `PAYMENT_NUMBERS` in `routes/coins.js`) as the source of truth — the frontend just displays what `/api/coins/packs` returns.
- Publisher status is a two-step flow: a user submits a `PublisherApplication`, an admin reviews it, and on approval `User.isPublisher`/`role` is updated — publishers then own `Manga` records (`Manga.authorId`) and earn coins (`User.coinsEarned`/`coinsBalance`) when readers unlock their chapters.

### Frontend (`src/`, ES modules)

- `main.jsx` — provider nesting order matters: `BrowserRouter` → `ToastProvider` → `AuthProvider` → `LangProvider` → `CartProvider` → `App`.
- `App.jsx` — all routes declared centrally in one file (no nested route config elsewhere). Route guards are simple wrapper components defined inline in `App.jsx`: `PrivateRoute` (any logged-in user) and `AdminRoute` (role `admin`/`superadmin`), both keyed off `useAuth()`.
- `api.js` — the single HTTP client for the whole app. Every backend resource has a matching exported `*Api` object here (`authApi`, `mangaApi`, `coinsApi`, `adminMangaApi`, `fandomApi`, etc.) wrapping the shared `request(method, path, body, auth)` helper. `request` auto-attaches the JWT bearer token, and on a 401 transparently calls `/api/auth/refresh` and retries once before forcing a logout/redirect to `/`. **New backend endpoints should get a corresponding function added to the matching `*Api` object in this file rather than calling `fetch` directly from components.**
- Auth/session state lives in `localStorage` under fixed keys (`op_token`, `op_refresh`, `op_user`, `op_subscription`) and is mirrored into `AuthContext` (`contexts/AuthContext.jsx`) on load; `AuthContext` also derives `isAdmin`, `isPublisher`, and `hasActiveSubscription` (checked against `activeSubscription.expiresAt`).
- `contexts/` holds the four global providers (Auth, Cart, Lang, Toast) referenced above — cross-cutting state goes here rather than prop-drilling.
- `hooks/useApi.js` provides `useApi(apiFn, deps, immediate)` for GET-style data fetching (loading/error/data/refresh) and `useMutation(apiFn)` for write actions — most page components use these instead of raw `useEffect`+`fetch`.
- `pages/` is organized by feature, one directory per route/section, each with an `index.jsx` and often a `sections/` or nested subfolder (e.g. `pages/Home/sections/`, `pages/Manga/{detail,reader,library,plans,publisher,coins}/`, `pages/Admin/sections/`). When adding a page, follow the existing feature-folder + `index.jsx` pattern rather than flat files in `pages/`.
- Bilingual content (FR/EN) is handled via `LangContext` plus paired DB columns/UI strings (`titleF`/`titleE`, `nameF`/`nameE`, etc.) — most content models on the backend carry both language variants rather than using a translation table.
- `public_html/` contains a standalone static `admin.html` — unrelated to the Vite build, do not confuse it with `public/` (Vite's static asset root) or `dist/` (build output).
