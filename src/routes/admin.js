const express = require('express');
const router = express.Router();

const { addCategory } = require('../controllers/admin');

router.post('/addCategory', addCategory);

module.exports = router;
