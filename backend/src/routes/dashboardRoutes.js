const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', dashboardController.getDashboardMetrics);
router.get('/stats', dashboardController.getDashboardMetrics);

module.exports = router;
