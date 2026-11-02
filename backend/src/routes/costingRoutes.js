const express = require('express');
const router = express.Router();
const costingController = require('../controllers/costingController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/order/:orderId', costingController.getOrderCosting);
router.get('/:orderId', costingController.getOrderCosting);

router.post('/order/:orderId/material-consumption', costingController.recordMaterialConsumption);
router.post('/:orderId/material-consumption', costingController.recordMaterialConsumption);
router.post('/:orderId/consume-material', costingController.recordMaterialConsumption);

router.delete('/material-consumption/:id', costingController.deleteMaterialConsumption);

router.post('/order/:orderId/labour-allocation', costingController.recordLabourAllocation);
router.post('/:orderId/labour-allocation', costingController.recordLabourAllocation);
router.post('/:orderId/allocate-labour', costingController.recordLabourAllocation);

router.delete('/labour-allocation/:id', costingController.deleteLabourAllocation);

module.exports = router;
