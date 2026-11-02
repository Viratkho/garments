const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/categories', materialController.getCategories);
router.post('/categories', materialController.createCategory);

router.get('/', materialController.getMaterials);
router.post('/', materialController.createMaterial);
router.get('/:id', materialController.getMaterialById);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);
router.post('/:id/adjust', materialController.adjustStock);

module.exports = router;
