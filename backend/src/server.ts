import { env } from './config/env';
import { createApp } from './app';
import { connectToDatabase } from './config/database';

async function start() {
  await connectToDatabase(env.mongoUri);
  console.log('Connected to MongoDB');

  const app = createApp(env.corsOrigins);
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
