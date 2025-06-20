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
const { deleteFromS3 } = require('../middleware/multer-s3');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey:
    process.env.AWS_SECRET_ACCESS_KEY 
});

const handleAdminLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required." });
    }

    const existingUser = await Admin.findOne({ email, role });

    if (existingUser) {
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      return res.status(200).json({
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully`,
        data: existingUser,
      });
    }

    if (role === "admin") {
      const adminUsersCount = await Admin.countDocuments({ role: "admin", status: "Active" });
      if (adminUsersCount >= 2) {
        return res.status(400).json({ message: "Only two active admin users are allowed" });
      }
    }

    const adminId = entityIdGenerator(role === "admin" ? "AD" : "US");
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await Admin.create({
      adminId,
      email,
      role,
      password: hashedPassword,
      updateOn: new Date(),
      createdOn: new Date(),
      status: "Active"
    });

    return res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      data: newUser,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const handleToDeleteAllAdminUsers = async (req, res) => {
  try {
    const result = await Admin.deleteMany({}); 

    return res.status(200).json({
      message: "All admin users deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
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
        const urlParts = categoryDetail.logo.split("/");
        const oldKey = urlParts[urlParts.length - 1];
        await deleteFromS3(oldKey);
      }

      restPayload.logo =
        logo.location || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${logo.key}`;
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { categoryId },
      restPayload,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(500).json({ message: "Failed to update category" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (err) {
    console.error("Update Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
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
const handleToAddAdditionalInformationAboutCourse = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const courseDetail = await Course.findOne({ courseId: payload.courseId });

    if (!courseDetail) {
      return res.status(404).json({ message: "Course not found" });
    }

    courseDetail.moreAboutCourse = {
      ...courseDetail.moreAboutCourse,
      duration: payload.moreAboutCourse?.duration || courseDetail.moreAboutCourse?.duration,
      noOfModules: payload.moreAboutCourse?.noOfModules || courseDetail.moreAboutCourse?.noOfModules,
      Activities: payload.moreAboutCourse?.Activities || courseDetail.moreAboutCourse?.Activities,
    };

    courseDetail.notes = {
      ...courseDetail.notes,
      notes1: payload.notes?.notes1 || courseDetail.notes?.notes1,
      notes2: payload.notes?.notes2 || courseDetail.notes?.notes2,
      notes3: payload.notes?.notes3 || courseDetail.notes?.notes3,
      notes4: payload.notes?.notes4 || courseDetail.notes?.notes4,
    };

    await courseDetail.save();

    return res.status(200).json({
      message: "Additional course information updated successfully",
      data: courseDetail,
    });

  } catch (err) {
    console.error("Update error:", err);
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

      const course = await Course.findOne({ courseId }); 

      if (!course) {
          return res.status(404).json({ message: "Course not found" });
      }

  
      const associatedCourses = await Course.find({ courseId }); 

      for (let course of associatedCourses) {
          if (course.image) {
              try {
                  const fileKey = course.image.split('/').pop();
                  await deleteFromS3(fileKey);
              } catch (err) {
                    console.warn(`Failed to delete image ${course.image}: ${err.message}`);
              }
          }
      }

      const deleteResult = await Course.deleteOne({ courseId }); 

      if (deleteResult.deletedCount === 1) {
          return res.status(200).json({ message: "Course deleted successfully" });
      } else {
          return res.status(500).json({ message: "Failed to delete course" });
      }

  } catch (err) {
      console.error("Delete Course Error:", err);
      return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const handleToUpdateCourse = async (req, res) => {
  try {
    const { courseId, ...restPayload } = req.body;
    const image = req.file;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const courseDetail = await Course.findOne({ courseId });

    if (!courseDetail) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (image) {
      if (courseDetail.image) {
        const urlParts = courseDetail.image.split("/");
        const oldKey = urlParts[urlParts.length - 1];
        await deleteFromS3(oldKey);
      }

      restPayload.image =
        image.location || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${image.key}`;
    }

    restPayload.updatedOn = new Date();

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
  handleToDeleteAllAdminUsers,
  handleToUploadPdfOfCourse,
  handleToAddAdditionalInformationAboutCourse
};
