const { Category } = require("../model/category");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { entityIdGenerator } = require("../utils/entityGenerator");
const Admin = require("../model/admin");
const Course = require("../model/courses");
const sendEmail = require("../utils/email");
const nodemailer = require("nodemailer");

const handleAdminLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const allowedEmail = "learn@gmail.com";
    const allowedPassword = "learn@12345";
    const allowedRole = "admin";

    if (
      email !== allowedEmail ||
      password !== allowedPassword ||
      role !== allowedRole
    ) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid credentials or role." });
    }

    //   const existingAdmin = await Admin.findOne({ email, role });
    //   if (existingAdmin) {
    //     return res.status(409).json({ message: "Admin already registered with this email and role." });
    //   }

    const adminId = entityIdGenerator("AD");
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = await Admin.create({
      adminId,
      email,
      role,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Admin logged in successfully",
      data: newAdmin,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const handleAddCategory = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.categoryName || !req.file) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const existingCategory = await Category.find({
      categoryName: payload.categoryName,
    });

    if (existingCategory.length > 0) {
      return res.status(409).json({ message: "This category already exists" });
    }

    const categoryId = entityIdGenerator("CA");

    const newCategory = new Category({
      categoryName: payload.categoryName,
      description: payload.description,
      logo: req.file.filename,
      categoryId,
      status: "Active",
    });

    const savedCategory = await newCategory.save();

    return res
      .status(201)
      .json({ message: "Category added successfully", data: savedCategory });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const handleGetCategory = async (req, res) => {
  try {
    const { categoryName, categoryId } = req.query;

    let query = {};
    if (categoryName) {
      query.categoryName = categoryName;
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const categories = await Category.find(query);

    if (categories.length === 0) {
      return res.status(404).json({ message: "No category found" });
    }

    return res
      .status(200)
      .json({ message: "Categories fetched successfully", data: categories });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const handleToUpdateCategory = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.categoryId) {
      return res.status(404).json({ message: "invalid payload field" });
    }
    const categoryDetail = await Category.find({
      categoryId: payload.categoryId,
    });
    if (!categoryDetail) {
      return res.status(404).json({ message: "category details not found" });
    }
    if (categoryDetail) {
      const updateCategoryDetail = await Category.updateMany(
        { categoryId: payload.categoryId },
        payload,
        { new: true }
      );
      if (!updateCategoryDetail) {
        return res
          .status(404)
          .json({ message: "not able to update the category Details" });
      }
      if (updateCategoryDetail) {
        return res.status(200).json({
          message: "Category updated successfully",
          data: updateCategoryDetail,
        });
      }
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
const handleToDeleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: "Invalid or missing categoryId" });
    }

    const categoryDetail = await Category.findOne({ categoryId });

    if (!categoryDetail) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.deleteOne({ categoryId });

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const handleToAddCourses = async (req, res) => {
  try {
    const payload = req.body;

    if (
      !payload.categoryName ||
      !payload.courseName ||
      !payload.description ||
      !req.file ||
      !payload.price
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const categoryDetails = await Category.findOne({
      categoryName: payload.categoryName,
    });

    if (!categoryDetails) {
      return res
        .status(400)
        .json({ message: "Select a valid category from the list" });
    }

    const courseId = entityIdGenerator("CI");
    const courseDetail = await Course.findOne({
      courseName: payload.courseName,
    });
    if (!courseDetail) {
      const newCourse = new Course({
        categoryName: payload.categoryName,
        categoryId: categoryDetails.categoryId,
        courseName: payload.courseName,
        price: Number(payload.price) || 0,
        description: payload.description,
        duration: payload.duration || "",
        image: req.file.filename,
        courseId,
        status: "Active",
      });
      const addedCourse = await newCourse.save();

      return res.status(201).json({
        message: "Course added successfully",
        data: addedCourse,
      });
    } else {
      return res.status(400).json({ message: "course already added" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

const handleToAddContent = async (req, res) => {
  try {
    const { courseId, courseContent } = req.body;

    if (
      !courseId ||
      !Array.isArray(courseContent) ||
      courseContent.length === 0
    ) {
      return res.status(400).json({
        message:
          "courseId and courseContent array are required with at least one item",
      });
    }

    const isValidContent = courseContent.every(
      (item) => item.moduleTitle && item.description
    );
    if (!isValidContent) {
      return res.status(400).json({
        message:
          "Each courseContent item must have moduleTitle and description",
      });
    }

    const course = await Course.findOne({ courseId });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (course) {
      const addContent = await Course.updateOne(
        { courseId },
        {
          $push: {
            courseContent: { $each: courseContent },
          },
          $set: {
            updateOn: new Date(),
          },
        }
      );

      return res.status(200).json({
        message: "Course content added successfully",
        data: addContent,
      });
    } else {
      return res.status(200).json({
        message: {},
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


const handleToUploadPdfOfCourse = async (req, res) => {
  try {
    const  payload = req.body;

    if (!payload.courseId || !req.file) {
      return res.status(400).json({ message: "Invalid payload: courseId and pdf file are required." });
    }

    const courseDetail = await Course.findOne({ courseId:payload.courseId });

    if (!courseDetail) {
      return res.status(404).json({ message: "Course not found with provided courseId." });
    }
    if(courseDetail){
      const updatedCourse = await Course.updateOne(
        { courseId :payload.courseId},
        { $set: { pdf: req.file.filename, updateOn: new Date() } }
      );
  
      return res.status(200).json({
        message: "PDF uploaded and linked to course successfully",
        data:{
        file: req.file.filename,
        updatedCourse:updatedCourse
        }
      });
    }
    else{
      return res.status(200).json({
        message: {},

      });
    }
   
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


const handleToGetCourses = async (req, res) => {
  try {
    const { courseName, courseId } = req.query;

    let query = {};

    if (courseName) {
      query.courseName = courseName;
    }
    if (courseId) {
      query.courseId = courseId;
    }

    const coursesList = await Course.find(query);
    const courseCount = await Course.countDocuments(query);

    return res.status(200).json({
      message: "Courses retrieved successfully",
      data: {
        courseCount,
        coursesList,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

const handleToDeleteCourse = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.courseId) {
      return res.status(400).json({ message: "Missing courseId fields" });
    }
    const courseDetail = await Course.find({ courseId: payload.courseId });
    if (courseDetail) {
      const deleteCourse = await Course.deleteOne({
        courseId: payload.courseId,
      });

      if (deleteCourse) {
        return res.status(200).json({ message: "Course deleted successfully" });
      }
    } else {
      return res.status(200).json({ message: {} });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

const handleToUpdateCourse = async (req, res) => {
  try {
    const payload = req.body;

    console.log("Payload:", payload);
    console.log("File:", req.file);

    if (!payload || !payload.courseId) {
      return res.status(400).json({ message: "Invalid payload fields" });
    }

    const courseDetail = await Course.findOne({ courseId: payload.courseId });

    if (!courseDetail) {
      return res.status(404).json({ message: "Course not found" });
    }

    const updateData = {
      categoryName: payload.categoryName || courseDetail.categoryName,
      courseName: payload.courseName || courseDetail.courseName,
      price: payload.price || courseDetail.price,
      description: payload.description || courseDetail.description,
      duration: payload.duration || courseDetail.duration,
      status: payload.status || courseDetail.status,
      updateOn: new Date(),
    };

    if (req.file && req.file.filename) {
      updateData.image = req.file.filename;
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { courseId: payload.courseId },
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (err) {
    console.error("Error updating course:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


module.exports = {
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
  handleToUploadPdfOfCourse
};
