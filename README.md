# Driver Behavior & Safety Scorecard

Record a drive from your phone's browser and get a safety score out of it. The app reads GPS and
accelerometer data as you drive, picks out the harsh braking, sharp turns, speeding and idling, and
turns all of that into a score out of 100 with a map replay of the route.

## Layout

```
backend/    Express + TypeScript, MongoDB via Mongoose
frontend/   Next.js (App Router, TypeScript, Tailwind, shadcn/ui)
```

The backend is a plain MVC split - `models/` for the Mongoose schemas, `controllers/` for the logic,
`routes/` for the URL bindings, `views/` for shaping the JSON that goes back out. `config/`,
`middleware/` and `utils/` are what you'd expect.

The frontend uses [shadcn/ui](https://ui.shadcn.com) on the Radix base for buttons, alerts, dialogs
and skeletons. The components live in `frontend/src/components/ui` as regular source files, and they
pick up the app's colours from the CSS variables in `globals.css`, so there's one palette for
everything. To pull in another one:

```bash
cd frontend
npx shadcn@latest add <component>
```

## Running it

You'll need Node 20+ and a MongoDB to point at - a local `mongod` or a free Atlas cluster.

```bash
cp backend/.env.example backend/.env          # set MONGODB_URI
cp frontend/.env.example frontend/.env.local
npm run setup
npm run dev
```

That runs both apps together: API on :4000, web on :3000. Open http://localhost:3000 and the home
page will tell you whether it can reach the API and whether Mongo is connected. If it can't, check
`MONGODB_URI` first - that's usually it.

Each app also runs on its own with `npm run dev` from inside its folder, if you want the logs separate.

### Recording on a phone

Browsers only hand out location and motion sensors on HTTPS pages (localhost is the one exception),
so `http://192.168.x.x:3000` from your phone won't work. The quickest fix is a tunnel for each app:

```bash
cloudflared tunnel --url http://localhost:4000   # note the https://...trycloudflare.com URL
cloudflared tunnel --url http://localhost:3000
```

Put the API tunnel URL in `frontend/.env.local` as `NEXT_PUBLIC_API_BASE_URL`, add the web tunnel URL
to `CORS_ORIGIN` in `backend/.env`, restart `npm run dev`, and open the web tunnel URL on your phone.
Keep the screen on while you drive. If the phone locks, the browser stops handing out GPS.

## Environment variables

**backend/.env**

`MONGODB_URI` = mongo connection string
`PORT` = backend port
`CORS_ORIGIN` = frontend origin to allow

My mongo uri for testing =>

MONGODB_URI = mongodb+srv://fortknight6901_db_user:wyZX9HgDhz3gbj7o@cluster0.ylnjilh.mongodb.net/ignitionai?retryWrites=true&w=majority&appName=Cluster0

**frontend/.env.local**

`NEXT_PUBLIC_API_BASE_URL` = backend api url

## Event detection

When a trip ends, the backend runs its points through `services/event-detection.service.ts` and
saves whatever it finds:

- **Harsh braking** - GPS speed dropping faster than 3 m/s² while above ~11 km/h
- **Sharp turn** - sideways acceleration over 3.5 m/s² while moving (the braking/accelerating part
  measured from GPS is taken out first, so a hard stop doesn't also count as a turn)
- **Over-speeding** - above 60 km/h for at least 2 seconds
- **Idle** - basically stationary for a minute or more

Back-to-back readings over a threshold count as one event, placed at the worst reading. All the
numbers live in `config/detection.ts`.

## Scoring

Every trip starts at 100 and loses points for each event, more for worse ones. A harsh brake costs
5 to 10 depending on severity, speeding 4 to 10, a sharp turn 4 to 8, and idling 1 to 3. The score
can't go below 0. A trip with no readings at all isn't scored, since there's nothing to judge. The
weights are in `config/scoring.ts`.

## API

Everything sits under `/api`. No auth - one implicit driver.

```
GET  /health              is the server up, is Mongo connected
POST /trips/start         opens a trip, returns its id
POST /trips/:id/points    send a batch of raw GPS + accelerometer samples
POST /trips/:id/end       closes the trip
GET  /trips               recent trips
GET  /trips/:id           one trip with its events
```

A point needs `timestamp`, `lat` and `lng`. `speed` and the three accel axes can be `null` - plenty
of devices don't report them, and null is stored as null so the detection engine can tell "no
reading" apart from "not moving".

```json
{
  "points": [
    {
      "timestamp": "2026-09-10T09:15:02Z",
      "lat": 12.9716,
      "lng": 77.5946,
      "speed": 11.4,
      "accelX": 0.31,
      "accelY": -0.08,
      "accelZ": 9.79
    }
  ]
}
```
