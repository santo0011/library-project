import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { seedDefaultAdmin } from './seed/seedAdmin.js';

const start = async () => {
  await connectDatabase();
  await seedDefaultAdmin();
  const app = createApp();
  app.listen(env.port, "0.0.0.0", () => console.log(`API running on port ${env.port}`));
};

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

