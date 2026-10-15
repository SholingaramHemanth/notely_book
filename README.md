# Notely — Your Thoughts, Your World

Notely is a premium dark-mode personal notes workspace built with React/Vite, Express, Mongoose, MongoDB, JWT, and bcryptjs. It follows the supplied scenic glassmorphism reference while keeping note actions real and server-backed.

## Requirements

- Node.js 20+
- pnpm 10+ or npm 10+
- MongoDB Community Server or a MongoDB Atlas database

## Windows setup

1. Install Node.js LTS from https://nodejs.org/ and MongoDB Community Server from https://www.mongodb.com/try/download/community, or create a MongoDB Atlas cluster.
2. Open PowerShell in this folder and run `corepack enable`, then `pnpm install`.
3. Copy `.env.example` to `.env` and set `MONGO_URI` and a long random `JWT_SECRET`. For a local MongoDB service, the default URI is `mongodb://127.0.0.1:27017/notely`.
4. Start MongoDB if it is installed as a service. In PowerShell, `Get-Service MongoDB` checks the service status.
5. Run `pnpm dev` and open `http://localhost:3000`. The Express server owns the API and Vite serves the React client.

For a production-like run, use `pnpm build`, set the variable in PowerShell with `$env:NODE_ENV='production'`, and then run `pnpm start`.

## Deploying to Vercel

The repository includes a Vercel Function at `api/[...path].js` for the Express API. Deploy the repository root with the default Vite build settings so Vercel serves `dist/` and routes `/api/*` requests to that function.

In Vercel, add these Project Environment Variables for each environment you deploy:

- `MONGO_URI`: a MongoDB Atlas connection string. Allow network access from Vercel in the Atlas network settings.
- `JWT_SECRET`: a long, random secret used to sign login sessions.

Redeploy after adding or changing environment variables. Check `/api/health` on the deployed domain; it should report `"database": true` before registering or signing in. Never put production credentials in `.env.example` or commit them to Git.

## Features

The protected workspace supports registration, login/logout, JWT sessions, owned notes, create/view/edit/delete, multiple tags, search across title/content/tags, pinning, archive/restore, Trash/restore/permanent delete, sorting, grid/list view, responsive layout, live statistics, calendar, tag counts, activity, loading/error/empty states, and unsaved-editor protection.

## API

All note endpoints require the `notely_token` httpOnly cookie or an `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account and start a session |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Return the current user |
| GET | `/api/notes?view=all&search=&tag=&sort=newest` | List owned notes |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Update an owned note or state |
| DELETE | `/api/notes/:id` | Move an owned note to Trash |
| DELETE | `/api/notes/:id?permanent=true` | Permanently delete a trashed owned note |
| GET | `/api/stats` | Return live owned-note statistics |
| GET | `/api/activity` | Return recent owned-note activity |
| GET | `/api/health` | Service and database health |

The backend always includes the authenticated user in note queries, so one account cannot read or mutate another account’s notes.

## Tests and checks

- `pnpm lint` checks backend JavaScript syntax.
- `pnpm build` creates the production frontend in `dist/`.
- `pnpm test` runs the API test scaffold. Set `TEST_BASE_URL` to a running server when executing integration tests.

## Preview and environment notes

Cloud Preview uses the protected `MONGO_URI` and `JWT_SECRET` project variables. For public HTTPS iframe Preview, the app uses a `SameSite=None; Secure` cookie configuration when the managed environment exposes its project origin. Local HTTP uses a less restrictive local cookie mode. Real credentials are never stored in source control.
