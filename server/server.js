import dotenv from 'dotenv';
import app from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.info('✓ Supabase PostgreSQL REST + Auth initialized as primary production database.');

  app.listen(PORT, () => {
    console.info(
      `✓ Command Center API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
};

startServer();
