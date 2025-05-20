const express = require("express");
const router = express.Router();

const {
  handleToContact,
  getAllContacts,
  handleToSendBrochure,
} = require("../controllers/user");

router.post("/contact", handleToContact);
router.get("/contact/users", getAllContacts);

router.post("/send/brochure", handleToSendBrochure);

module.exports = router;
