// Load environment variables from backend/.env before anything else.
require('dotenv').config();

const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 4000;

/**
 * Validates configuration, proves the database connection works, then starts
 * listening. Failing loudly here saves a lot of debugging later.
 */
async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('\n[DATABASE_URL is missing]');
    console.error('Create backend/.env (copy backend/.env.example) and paste your');
    console.error('Neon PostgreSQL connection string into DATABASE_URL.\n');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error('\n[JWT_SECRET is missing] Add a long random string to backend/.env\n');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    console.log('Connected to the PostgreSQL database');
  } catch (error) {
    console.error('\n[Could not connect to PostgreSQL]');
    console.error(error.message);
    console.error('Check DATABASE_URL in backend/.env and that your Neon project is awake.\n');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Library API is running on http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

// Close the database connection cleanly on Ctrl+C.
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
