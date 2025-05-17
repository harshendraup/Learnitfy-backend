const express = require('express');
const router = express.Router();

const { handleAdminLogin, handleAddCategory ,handleGetCategory} = require('../controllers/admin');

router.post('/addCategory', handleAddCategory);
router.post('/login', handleAdminLogin);
router.get('/get/category',handleGetCategory)

module.exports = router;