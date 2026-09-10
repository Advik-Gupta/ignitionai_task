# Driver Behavior & Safety Scorecard

Record a drive from your phone's browser and get a safety score out of it. The app reads GPS and
accelerometer data as you drive, picks out the harsh braking, sharp turns, speeding and idling, and
turns all of that into a score out of 100 with a map replay of the route.

## Layout

```
backend/    Express + TypeScript, MongoDB via Mongoose
frontend/   Next.js (App Router, TypeScript, Tailwind)
```

The backend is a plain MVC split - `models/` for the Mongoose schemas, `controllers/` for the logic,
`routes/` for the URL bindings, `views/` for shaping the JSON that goes back out. `config/`,
`middleware/` and `utils/` are what you'd expect.

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

## Environment variables

**backend/.env**

`MONGODB_URI` = mongo connection string
`PORT` = backend port
`CORS_ORIGIN` = frontend origin to allow

My mongo uri for testing =>

MONGODB_URI = mongodb+srv://fortknight6901_db_user:wyZX9HgDhz3gbj7o@cluster0.ylnjilh.mongodb.net/ignitionai?retryWrites=true&w=majority&appName=Cluster0

**frontend/.env.local**

`NEXT_PUBLIC_API_BASE_URL` = backend api url

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
