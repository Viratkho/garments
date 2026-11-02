require('dotenv').config();
const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify MySQL connection via Prisma
    await prisma.$connect();
    console.log('✓ Successfully connected to MySQL database: garmentflow_db');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  DP ENTERPRISES – GarmentFlow ERP Server running`);
      console.log(`  Local:        http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
