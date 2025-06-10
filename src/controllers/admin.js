const { Category } = require("../model/category");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { entityIdGenerator } = require("../utils/entityGenerator");
const Admin = require("../model/admin");
const Course = require("../model/courses");
const sendEmail = require("../utils/email");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const AWS = require("aws-sdk");
const deleteFromS3 = require('../middleware/multer-s3')

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey:
    process.env.AWS_SECRET_ACCESS_KEY 
});

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

const handleAddCategory = async (req, res, next) => {
  try {
    const payload = req.body;

    const logoFile = req.file;
    const logoUrl = logoFile?.location || "";

    if (!payload.categoryName || !payload.description) {
      const error = new Error("Category name and description are required");
      error.statusCode = 422;
      return next(error);
    }

    const categoryName = payload.categoryName.trim();

    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      const error = new Error("Category already exists");
      error.statusCode = 409;
      return next(error);
    }

    const categoryId = entityIdGenerator("CA");

    const newCategory = new Category({
      categoryName,
      description: payload.description.trim(),
      logo: logoUrl,
      categoryId,
      status: "Active",
      createdBy: "Admin",
    });

    const savedCategory = await newCategory.save();

    return res.status(201).json({
      message: "Category added successfully",
      data: savedCategory,
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    return next(error);
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
    const { categoryId, ...restPayload } = req.body;
    const logo = req.file; 

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const categoryDetail = await Category.findOne({ categoryId });

    if (!categoryDetail) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (logo) {
      if (categoryDetail.logo) {
        const oldKey = categoryDetail.logo;
    
        console.log("🧾 Deleting old S3 object with key:", oldKey, typeof oldKey); 
    
        await s3
          .deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME || "prod-learnitfy-server-s3-01",
            Key: String(oldKey), 
          })
          .promise()
          .catch((err) =>
            console.warn("S3 old logo delete warning (not fatal):", err.message)
          );
      }
    
      restPayload.logo = logo.key; 
    }

    const updated = await Category.findOneAndUpdate(
      { categoryId },
      restPayload,
      { new: true }
    );

    if (!updated) {
      return res.status(500).json({ message: "Failed to update category" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Update Error:", err);
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
      !payload.price
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const categoryDetails = await Category.findOne({
      categoryName: payload.categoryName,
    });

    if (!categoryDetails) {
      return res.status(400).json({
        message: "Select a valid category from the list",
      });
    }

    const existingCourse = await Course.findOne({
      courseName: payload.courseName,
    });

    if (existingCourse) {
      return res.status(400).json({ message: "Course already added" });
    }

    const courseId = entityIdGenerator("CI");

    const newCourse = new Course({
      categoryName: payload.categoryName,
      categoryId: categoryDetails.categoryId,
      courseName: payload.courseName,
      price: Number(payload.price) || 0,
      description: payload.description,
      duration: payload.duration || "",
      image: req.file?.location || "", 
      courseId,
      status: "Active",
    });

    const addedCourse = await newCourse.save();

    await Category.updateOne(
      { categoryName: payload.categoryName },
      {
        $push: {
          "courseDetails.courses": payload.courseName,
          "courseDetails.courseId": courseId,
        },
      }
    );

    return res.status(201).json({
      message: "Course added successfully",
      data: addedCourse,
    });
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
    const payload = req.body;

    if (!payload.courseId || !req.file) {
      return res.status(400).json({
        message: "Invalid payload: courseId and pdf file are required.",
      });
    }

    const courseDetail = await Course.findOne({ courseId: payload.courseId });

    if (!courseDetail) {
      return res
        .status(404)
        .json({ message: "Course not found with provided courseId." });
    }

    const updatedCourse = await Course.updateOne(
      { courseId: payload.courseId },
      {
        $set: {
          pdf: req.file.location,
          updateOn: new Date(),
        },
      }
    );

    return res.status(200).json({
      message: "PDF uploaded and linked to course successfully",
      data: {
        file: req.file.location, 
        updatedCourse: updatedCourse,
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

const handleToGetCourses = async (req, res) => {
  try {
    const { courseName, courseId ,categoryName} = req.query;

    let query = {};

    if (courseName) {
      query.courseName = courseName;
    }
    if (courseId) {
      query.courseId = courseId;
    }
    if(categoryName){
      query.categoryName=categoryName
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
      const { courseId } = req.body;
  
      if (!courseId) {
        return res.status(400).json({ message: "Missing courseId" });
      }
  
      const course = await Course.find({ courseId });
  
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      const associatedCourses = await Course.find({ courseId });
  
      for (let course of associatedCourses) {
        if (course.image) {
          try {
            await deleteFromS3(course.image);
          } catch (err) {
            console.warn(`Failed to delete image ${course.image}: ${err.message}`);
          }
        }
      }
  
  
      const deleteResult = await Course.delete({ courseId });
  
      if (deleteResult.deletedCount === 1) {
        return res.status(200).json({ message: "Category and its courses deleted successfully" });
      } else {
        return res.status(500).json({ message: "Failed to delete category" });
      }
  
    } catch (err) {
      console.error("Delete Category Error:", err);
      return res.status(500).json({ message: "Internal server error", error: err.message });
    }
  };

const handleToUpdateCourse = async (req, res) => {
  try {
    const { courseId, ...restPayload } = req.body;
    const imageFile = req.file;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const courseDetail = await Course.findOne({ courseId });

    if (!courseDetail) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (imageFile) {
      const oldImagePath = path.join(
        __dirname,
        "../coursesImg/",
        courseDetail.image
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      restPayload.image = imageFile.filename;
    }

    restPayload.updateOn = new Date();

    const updatedCourse = await Course.findOneAndUpdate(
      { courseId },
      restPayload,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(500).json({ message: "Failed to update course" });
    }

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
