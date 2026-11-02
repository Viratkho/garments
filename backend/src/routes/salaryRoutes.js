const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', salaryController.getSalaries);
router.post('/generate', salaryController.generateMonthlySalaries);
router.post('/pay', salaryController.recordSalaryPayment);

module.exports = router;
