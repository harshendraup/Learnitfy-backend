const express = require("express");
const router = express.Router();
const { categoryLogo, coursesImg, coursePdf ,excelUpload } = require("../middleware/multer-s3");


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
  handleToAddContent,
  handleToUploadPdfOfCourse,
  handleToDeleteAllAdminUsers,
  handleToAddAdditionalInformationAboutCourse,
  uploadExcelFile,
  deleteAllGstData,
  handleToGetGstData,
  handleToAddCourseDetails,
  DeleteEntireDataOfDB,
  handleToDeleteCourseModule
} = require("../controllers/admin");


router.post(
  "/addCategory",
  categoryLogo.single("logo"), 
  handleAddCategory
);

router.post("/login", handleAdminLogin);
router.delete('/delete',handleToDeleteAllAdminUsers)
router.get("/get/category", handleGetCategory);

router.patch(
  "/update/category", 
  categoryLogo.single("logo"), 
  handleToUpdateCategory
);

router.delete("/delete/category", handleToDeleteCategory);

router.post("/add/course", coursesImg.single("image"), handleToAddCourses);
router.post('/add/course/detail',handleToAddCourseDetails)
router.post('/add/activities',handleToAddAdditionalInformationAboutCourse)
router.get("/get/courses", handleToGetCourses);
router.delete("/delete/course", handleToDeleteCourse);
router.delete('/delete/course/module',handleToDeleteCourseModule)
router.patch("/update/course", coursesImg.single("image"), handleToUpdateCourse);

router.post("/add/content", handleToAddContent);
router.post("/upload/pdf", coursePdf.single("pdf"), handleToUploadPdfOfCourse);



// route for gst project::::;
router.post("/upload-excel", excelUpload.single("file"), uploadExcelFile);
router.get('/get/gstData',handleToGetGstData)
router.delete('/gstdata/delete',deleteAllGstData )
router.delete('/delete/dbData',DeleteEntireDataOfDB)

module.exports = router;
