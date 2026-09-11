# Driver Behavior & Safety Scorecard

A web app that records a real drive using your phone's GPS and accelerometer, right in the browser.
When the trip ends, it picks out harsh braking, sharp turns, over-speeding and idling, turns them
into a safety score out of 100, and shows the result with a breakdown chart, a driving tip and the
route on a map. There's also a daily streak and a leaderboard across drivers.

Deployed Link = https://ignitionai-task.vercel.app (render backend might take some time to boot up as it boots down during inactivity so just wait a while and reload the site in 2-3 minutes)

## Tech stack

- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Leaflet
- **Backend:** Express (TypeScript), MongoDB with Mongoose

## Running locally

You'll need Node 20+ and a MongoDB database

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

My Mongo URI for testing =>

MONGODB_URI = mongodb+srv://fortknight6901_db_user:wyZX9HgDhz3gbj7o@cluster0.ylnjilh.mongodb.net/ignitionai?retryWrites=true&w=majority&appName=Cluster0

**frontend/.env.local**

`NEXT_PUBLIC_API_BASE_URL` = backend api url

### Sample data

The database is seeded by default. When the API starts against an empty database, it loads a week
of simulated trips for three drivers, so every page has something to show straight away.

To start over, press **Reset sample data** on the Trips page. It cleans out the sample trips and
generates a fresh set (trips recorded on a phone are kept). `npm run seed` does the same from the
terminal.
