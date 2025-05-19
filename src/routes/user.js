const express = require('express');
const router = express.Router();


const { handleToContact, getAllContacts } = require('../controllers/user');

router.post('/contact', handleToContact);
router.get('/contact/users', getAllContacts);  
module.exports = router;