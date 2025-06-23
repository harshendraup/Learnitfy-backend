const express = require("express");
const router = express.Router();

const {
  handleToContact,
  getAllContacts,
  handleToSendBrochure,
  getAllBrochureRequests,
  handleToEnrollForCourse,
  handleToGetEnrolledUser,
  deleteAllContacts,
  deleteAllEnquiries
} = require("../controllers/user");

router.post("/contact", handleToContact);
router.get("/contact/users", getAllContacts);
router.delete('/delete/contacts',deleteAllContacts)

router.post("/send/brochure", handleToSendBrochure);
router.get('/brochure/requests',getAllBrochureRequests)
router.post('/enroll',handleToEnrollForCourse)
router.get('/get/enroll',handleToGetEnrolledUser)
router.delete('/delete/enrollUsers',deleteAllEnquiries)

module.exports = router;
