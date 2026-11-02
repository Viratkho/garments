const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticate);

router.get('/', purchaseController.getPurchases);
router.post('/', upload.single('billAttachment'), purchaseController.createPurchase);
router.get('/:id', purchaseController.getPurchaseById);

module.exports = router;
