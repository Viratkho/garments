const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);
router.post('/logo', upload.single('logo'), settingsController.uploadLogo);
router.delete('/logo', settingsController.removeLogo);

module.exports = router;
