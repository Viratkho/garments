const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticate);

router.get('/', orderController.getOrders);
router.post('/', upload.single('designImage'), orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.put('/:id', upload.single('designImage'), orderController.updateOrder);
router.post('/:id/duplicate', orderController.duplicateOrder);
router.post('/:id/cancel', orderController.cancelOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
