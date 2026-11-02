require('dotenv').config();
const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify MySQL connection via Prisma
    await prisma.$connect();
    console.log('✓ Successfully connected to MySQL database: garmentflow_db');

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  GARMENTFLOW Manufacturing ERP Server is running`);
      console.log(`  Port: http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
