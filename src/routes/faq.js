const express = require("express");
const router = express.Router();

const {
    handleToAddFaq,
    handleToGetFaq,
    handleToDeleteFaq
}= require('../controllers/faq');

router.post('/add',handleToAddFaq);
router.get('/get',handleToGetFaq);
router.delete('/delete',handleToDeleteFaq)









module.exports = router;