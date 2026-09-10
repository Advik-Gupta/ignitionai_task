# Driver Behavior & Safety Scorecard

Records a real drive using the phone's GPS and accelerometer through the browser, detects harsh
braking, sharp turns, over-speeding and idle time from the raw signal, turns those events into a
0–100 safety score, and shows the result on a dashboard with a map replay of the route.

## Layout

```
backend/    Express + TypeScript API, MongoDB via Mongoose
frontend/   Next.js (App Router, TypeScript, Tailwind)
```

## Requirements

- Node.js 20+
- A MongoDB instance - either local (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas cluster

## Running locally

Both apps at once, from the repo root:

```bash
cp backend/.env.example backend/.env          # edit MONGODB_URI if you are not using a local mongod
cp frontend/.env.example frontend/.env.local
npm run setup                                 # installs root, backend and frontend dependencies
npm run dev                                   # API on :4000, web on :3000
```

`npm run dev` uses `concurrently`, prefixing each line with `api` or `web` so you can tell the two
logs apart. It stops both processes if either one fails to start.

Or run them in separate terminals if you want the logs isolated - start the API first.

### Backend only

```bash
cd backend
cp .env.example .env      # then edit MONGODB_URI if you are not using a local mongod
npm install
npm run dev
```

The API listens on `http://localhost:4000`. Check it directly:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","database":"connected","uptimeSeconds":3,"timestamp":"..."}
```

`database` reports the live Mongoose connection state - if it says anything other than `connected`,
the `MONGODB_URI` in `.env` is wrong or the database is not reachable.

### Frontend only

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The home page calls `/api/health` on the backend and shows whether the
API responds and whether Mongo is connected.

## Environment variables

**backend/.env**

`MONGODB_URI` = mongo connection string
`PORT` = backend port
`CORS_ORIGIN` = frontend port to allow cors

My mongo uri for testing =>

MONGODB_URI = mongodb+srv://fortknight6901_db_user:wyZX9HgDhz3gbj7o@cluster0.ylnjilh.mongodb.net/ignitionai?retryWrites=true&w=majority&appName=Cluster0

**frontend/.env.local**

`NEXT_PUBLIC_API_BASE_URL` = backend api url

## Scripts

root - `npm run dev` - Runs the API and the web app together
frontend - `npm run dev` - Next.js frontend on port 3000  
backend - `npm run dev` - tsx watch mode on `src/server.ts`
