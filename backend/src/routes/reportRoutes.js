const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/profit-loss', reportController.getProfitLoss);
router.get('/order-costings', reportController.getOrderCostingsReport);
router.get('/export/orders-excel', reportController.exportOrdersExcel);
router.get('/export/orders', reportController.exportOrdersExcel);
router.get('/export/inventory-excel', reportController.exportInventoryExcel);
router.get('/export/inventory', reportController.exportInventoryExcel);
router.get('/export/profit-loss-pdf', reportController.exportProfitLossPdf);

module.exports = router;
