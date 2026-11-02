const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', attendanceController.getAttendance);
router.post('/', attendanceController.recordAttendance);
router.get('/summary', attendanceController.getMonthlyAttendanceSummary);

module.exports = router;
