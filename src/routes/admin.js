const express = require("express");
const router = express.Router();
const coursesImg = require('../middleware/coursesImg')
const categoryLogo= require('../middleware/categoryLogo')

const {
  handleAdminLogin,
  handleAddCategory,
  handleGetCategory,
  handleToAddCourses,
} = require("../controllers/admin");



router.post("/addCategory", categoryLogo.single("logo"), handleAddCategory);
router.post("/login", handleAdminLogin);
router.get("/get/category", handleGetCategory);

router.post("/add/course", coursesImg.single("image"), handleToAddCourses);

module.exports = router;
