const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticate);

router.get('/categories', expenseController.getCategories);
router.post('/categories', expenseController.createCategory);

router.get('/', expenseController.getExpenses);
router.post('/', upload.single('receipt'), expenseController.createExpense);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', upload.single('receipt'), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);
router.post('/:id/allocate', expenseController.allocateOverheadExpense);

module.exports = router;
