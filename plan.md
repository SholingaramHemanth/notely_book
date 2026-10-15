# Notely — Implementation & Design Plan

## Scope

Build Notely as a complete React/Vite + Express/Mongoose application with JWT and bcrypt authentication, persistent MongoDB notes, protected REST APIs, and a premium responsive dashboard matching the supplied visual reference. The managed Webdev server capability is enabled for the Express runtime. The application expects `MONGO_URI` and `JWT_SECRET` through protected environment configuration; `.env.example` documents them without storing secrets.

## Implementation approach

- **Single Node application**: Express owns `/api/*`, serves the production Vite build, and runs Vite middleware during development on port 3000.
- **Frontend**: React with React Router, Lucide icons, reusable dashboard components, and a single app stylesheet using CSS variables, glass panels, responsive grid/flex breakpoints, reduced-motion support, and no dead actions.
- **Backend**: Express routes with centralized async error handling, `express-validator`-style manual validators, Mongoose User/Note models, JWT bearer tokens in an `httpOnly` cookie plus Authorization fallback, bcrypt password hashing, and ownership clauses in every note query.
- **Data model**: Users own notes through `user` ObjectId references. Notes support title, content, tags, pinned, archived, trashed, timestamps, and a cover theme used only for decorative artwork.
- **Dashboard state**: Authenticated user loads notes and stats through API calls. Search, tag filtering, sorting, view mode, archive/trash tabs, editor modal, delete confirmation, and toast feedback all operate on the server-backed state.
- **Preview fallback**: If no MongoDB connection is available, the server reports a clear configuration error instead of pretending persistence works. The UI remains usable for the login/register shell and displays a connection error state.
- **Documentation and packaging**: Include README with Windows/MongoDB/backend/frontend setup, API docs, test scripts, `.env.example`, route manifest, and a reproducible ZIP artifact.

## Design system

### Design Movement

**Nocturnal editorial glassmorphism** — an atmospheric productivity workspace where cinematic landscape lighting meets restrained dashboard utility.

### Core Principles

1. **Calm focus**: large readable type, generous spacing, and dark surfaces keep attention on ideas.
2. **Layered depth**: translucent navy panels, blurred scenic light, and fine gradient borders create spatial hierarchy.
3. **Useful color**: purple, green, cyan, and orange are semantic accents for navigation, health, tags, and status.
4. **Quiet delight**: short hover lifts, soft glows, and clear feedback make routine note actions feel polished.

### Color Philosophy

Midnight navy is the canvas; electric purple is Notely’s ownable creative signal; violet/cyan create an aurora-like energy; emerald and amber are functional, optimistic highlights. White text is softened rather than stark to preserve the night-workspace mood.

### Layout Paradigm

A left command rail, wide editorial workspace, and compact context rail. The hero spans the center workspace as a scenic “idea horizon”; stats and notes flow beneath it, while calendar/tags/activity stay visibly secondary.

### Signature Elements

- Feather mark with a violet-to-cyan gradient halo.
- Scenic hero vignette with a readable dark gradient overlay.
- Note cards with decorative cover bands and semantic tag pills.

### Interaction Philosophy

Actions are direct and reversible where possible. Cards lift on hover, active navigation uses a bright gradient state, editor flows in as a focused glass sheet, and destructive actions always explain consequences before confirming.

### Animation

Use 180–240ms ease-out transitions for hover/focus, a subtle page fade/slide on dashboard mount, a low-amplitude ambient glow in the hero, and dialog scale/fade. Respect `prefers-reduced-motion` by disabling nonessential transforms and ambient movement.

### Typography System

Use `Inter` for UI and body copy, with `Space Grotesk` for the Notely wordmark and key hero headlines. Establish a clear 12/14/16/20/28/40px scale with 1.15–1.5 line heights.

### Brand Essence

A private, cinematic home for thoughts — for students and creative builders who want their notes to feel as considered as their ideas. **Atmospheric, focused, expressive.**

### Brand Voice

Headlines are warm and concise; CTAs are active and specific; microcopy is encouraging without being chatty.

- “Good ideas deserve a place to land.”
- “Shape the thought before it slips away.”

### Wordmark & Logo

A minimal feather folded into a note corner, rendered as a violet/cyan gradient mark beside the lowercase `notely` wordmark.

### Signature Brand Color

**Notely Aurora `#8B5CF6`** — a luminous violet that reads as creative without becoming loud.

## Project structure

```text
notely/
├── client/
│   ├── src/
│   │   ├── api.js                # authenticated fetch helpers
│   │   ├── App.jsx               # routes and auth shell
│   │   ├── main.jsx              # React entry
│   │   ├── components/           # sidebar, topbar, cards, widgets, dialogs
│   │   ├── pages/                # Login, Register, Dashboard
│   │   └── styles.css            # design system and responsive layout
│   └── index.html
├── server/
│   ├── index.js                  # Express + Vite middleware entry
│   ├── middleware/auth.js        # JWT auth and ownership helpers
│   ├── models/User.js
│   ├── models/Note.js
│   └── routes/                   # auth, notes, stats
├── public/
│   └── manus-routes.json
├── tests/                        # API-focused test scaffolds
├── .env.example
├── app.config.ts
├── package.json
├── README.md
├── TODO.md
└── plan.md
```

## Build workflow

1. Create the route manifest, package metadata, app config, and diagnostics registration.
2. Implement the API models, auth middleware, validation, CRUD, search/filter/sort, stats, archive/trash, and consistent JSON errors.
3. Implement the authenticated React shell, visual dashboard, editor modal, responsive states, and API integration.
4. Install dependencies, run lint/build/API smoke checks, and start the managed Preview service.
5. Verify `/manus-routes.json`, the preview HTTP response, the production build, and the absence of actionable diagnostics.
6. Commit/push the canonical checkpoint and create `notely-project.zip` containing source and docs but excluding `node_modules`, `.git`, and real `.env` secrets.
