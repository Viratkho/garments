const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/stages', productionController.getProductionStages);
router.get('/order/:orderId', productionController.getOrderProduction);
router.post('/order/:orderId/update', productionController.updateStageProgress);
router.post('/order/:orderId/quality', productionController.recordQualityCheck);
router.post('/order/:orderId/delivery', productionController.recordDelivery);

module.exports = router;
