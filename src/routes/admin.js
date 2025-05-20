const express = require("express");
const router = express.Router();
const coursesImg = require('../middleware/coursesImg')
const categoryLogo= require('../middleware/categoryLogo')

const {
  handleAdminLogin,
  handleAddCategory,
  handleGetCategory,
  handleToAddCourses,
  handleToUpdateCategory,
  handleToDeleteCategory,
  handleToGetCourses,
  handleToDeleteCourse,
  handleToUpdateCourse,
  handleToSendBrochure
} = require("../controllers/admin");



router.post("/addCategory", categoryLogo.single("logo"), handleAddCategory);
router.post("/login", handleAdminLogin);
router.get("/get/category", handleGetCategory);
router.patch("/update/category", handleToUpdateCategory)
router.delete("/delete/category",handleToDeleteCategory)



router.post("/add/course", coursesImg.single("image"), handleToAddCourses);
router.get("/get/courses", handleToGetCourses);
router.delete("/delete/course", handleToDeleteCourse);
router.patch('/update/course',handleToUpdateCourse)




module.exports = router;
