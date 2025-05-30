const express = require("express");
const router = express.Router();

const {
  handleToContact,
  getAllContacts,
  handleToSendBrochure,
  getAllBrochureRequests
} = require("../controllers/user");

router.post("/contact", handleToContact);
router.get("/contact/users", getAllContacts);

router.post("/send/brochure", handleToSendBrochure);
router.get('/brochure/requests',getAllBrochureRequests)

module.exports = router;
