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
const { deleteFromS3,excelUpload} = require('../middleware/multer-s3');
const XLSX = require("xlsx");
const { gst } = require("../model/gst"); 
const axios = require("axios");

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
      if (adminUsersCount >= 10) {
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
      return res.status(200).json([]);
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

    const relatedCourses = await Course.find({ categoryId });

    for (const course of relatedCourses) {
      if (course.image) {
        try {
          const fileKey = course.image.split("/").pop();
          await deleteFromS3(fileKey);
        } catch (err) {
          console.warn(`Failed to delete image from S3: ${err.message}`);
        }
      }

      if (course.pdf) {
        try {
          const fileKey = course.pdf.split("/").pop();
          await deleteFromS3(fileKey);
        } catch (err) {
          console.warn(`Failed to delete PDF from S3: ${err.message}`);
        }
      }

      await Course.deleteMany({ courseId: course.courseId });
    }

    await Category.deleteOne({ categoryId });

    return res.status(200).json({
      message: "Category and all associated courses deleted successfully",
    });

  } catch (err) {
    console.error("Delete Category Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
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


function parseExcelDate(excelDate) {
  if (typeof excelDate === 'number') {
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    return jsDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } else if (typeof excelDate === 'string' && !isNaN(Date.parse(excelDate))) {
    const jsDate = new Date(excelDate);
    return jsDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }
  return null;
}

const uploadExcelFile = async (req, res) => {
  try {
    const fileUrl = req.file.location;

    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const insertedDocs = [];

    for (const row of data) {
      const newGst = new gst({
        excelFile: fileUrl,
        SourceName: row["Source Name"],
        SupplierGSTIN: row["Supplier GSTIN"],
        SupplierLegalName: row["Supplier Legal Name"],
        SupplierTradeName: row["Supplier TradeN ame"],
        invoiceDate: parseExcelDate(row["Invoice Date"]),
        booksDate: parseExcelDate(row["Books Date"]),
        invoiceNumber: row["Invoice Number"],
        TotalTaxableValue: Number(row["Total Taxable Value"]) || 0,
        TotalTaxValue: Number(row["Total Tax Value"]) || 0,
        TotalIGSTAmount: Number(row["Total IGST Amount"]) || 0,
        TotalCGSTAmount: Number(row["Total CGST Amount"]) || 0,
        TotalSGSTAmount: Number(row["Total SGST Amount"]) || 0,
        TotalInvoiceValue: row["Total Invoice Value"],
        GSTR2ABooksSource: row["GSTR-2A/Books Source"],
        section: row["Section"],
        ReturnFiled: row["Return Filed"],
        FilingYear: row["Filing Year"],
        FilingMonth: row["Filing Month"],
        FilingDate: parseExcelDate(row["Filing Date"]),
        GSTR3BReturnStatus: row["GSTR-3B Return Status"] === "true" || row["GSTR-3B Return Status"] === true,
        EffCancellationDate: parseExcelDate(row["Eff. Cancellation Date"])
      });

      const savedDoc = await newGst.save();
      insertedDocs.push(savedDoc);
    }

    return res.status(200).json({
      message: "Excel data uploaded and saved successfully",
      data: insertedDocs
    });

  } catch (err) {
    console.error("Excel Upload Error:", err.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
};

const handleToGetGstData= async(req,res)=>{
  try{
    const gstData= await gst.find({});
    if(gstData.length>1){
      return res.status(200).json({
        message: "Excel data fetched successfully",
        data: gstData
      });
    }
    else{
      return res.status(200).json({
        message: "Excel data fetched successfully",
        data: {}
      });
    }

  }
  catch (err) {
    console.error("Excel Upload Error:", err.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
}

const deleteAllGstData = async (req, res) => {
  try {
    const result = await gst.deleteMany({});
    return res.status(200).json({
      message: "All GST records deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error deleting GST data:", err.message);
    return res.status(500).json({
      message: "Internal Server Error",
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
  handleToAddAdditionalInformationAboutCourse,
  uploadExcelFile,
  deleteAllGstData,
  handleToGetGstData
};
