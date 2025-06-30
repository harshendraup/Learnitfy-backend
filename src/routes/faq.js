const express = require("express");
const router = express.Router();

const {
    handleToAddFaq,
    handleToGetFaq,
    handleToDeleteFaq,
    handleToUpdateFaq
}= require('../controllers/faq');

router.post('/add',handleToAddFaq);
router.get('/get',handleToGetFaq);
router.delete('/delete',handleToDeleteFaq)
router.patch('/update',handleToUpdateFaq)









module.exports = router;