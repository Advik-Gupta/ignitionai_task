# Driver Behavior & Safety Scorecard

A web app that records a real drive using your phone's GPS and accelerometer, right in the browser.
When the trip ends it picks out harsh braking, sharp turns, over-speeding and idling, turns them
into a safety score out of 100, and shows the result with a breakdown chart, a driving tip and the
route on a map. There's also a daily streak and a leaderboard across drivers.

## Tech stack

- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Recharts, Leaflet with
  OpenStreetMap
- **Backend:** Express (TypeScript), MongoDB with Mongoose

## Running locally

You'll need Node 20+ and a MongoDB database (local or a free Atlas cluster).

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run setup
npm run dev
```

The API runs on http://localhost:4000 and the app on http://localhost:3000.

**backend/.env**

`MONGODB_URI` = mongo connection string
`PORT` = backend port
`CORS_ORIGIN` = frontend URL(s) allowed to call the API, comma separated

My mongo uri for testing =>

MONGODB_URI = mongodb+srv://fortknight6901_db_user:wyZX9HgDhz3gbj7o@cluster0.ylnjilh.mongodb.net/ignitionai?retryWrites=true&w=majority&appName=Cluster0

**frontend/.env.local**

`NEXT_PUBLIC_API_BASE_URL` = backend api url

### Sample data

The database is seeded by default. When the API starts against an empty database, it loads a week
of simulated trips for three drivers, so every page has something to show straight away.

To start over, press **Reset sample data** on the Trips page. It cleans out the sample trips and
generates a fresh set (trips recorded on a phone are kept). `npm run seed` does the same from the
terminal.

### Recording on a phone

Browsers only allow GPS and motion sensors on HTTPS, so for phone testing expose both apps with a
tunnel such as `cloudflared tunnel --url http://localhost:3000` and put the tunnel URLs in the two
env files.

## Deployment

The API deploys to Render using `render.yaml`, the frontend to Vercel with `frontend` as the root
directory, and the database runs on MongoDB Atlas. Set the same environment variables on each.
