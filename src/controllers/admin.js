const { Category } = require("../model/category");
const bcrypt= require('bcrypt')
const { entityIdGenerator } = require("../utils/entityGenerator");
const Admin= require('../model/admin');
const Course= require('../model/courses')


const handleAdminLogin = async (req, res) => {
    try {
      const { email, password, role } = req.body;
  
      const allowedEmail = "learn@gmail.com";
      const allowedPassword = "learn@12345";
      const allowedRole = "admin";
  
      if (email !== allowedEmail || password !== allowedPassword || role !== allowedRole) {
        return res.status(401).json({ message: "Unauthorized: Invalid credentials or role." });
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
      return res.status(500).json({ message: "Internal server error", error: err.message });
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
      const { categoryName } = req.query;
  
      let query = {};
      if (categoryName) {
        query.categoryName = categoryName;
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

  const handleToAddCourses = async (req, res) => {
    try {
      const payload = req.body;
  
      if (
        !payload.categoryName ||
        !payload.courseName ||
        !payload.description ||
        !req.file
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      const categoryDetails = await Category.findOne({ categoryName: payload.categoryName });
  
      if (!categoryDetails) {
        return res.status(400).json({ message: "Select a valid category from the list" });
      }
  
      const courseId = entityIdGenerator("CI");
  
      const newCourse = new Course({
        categoryName: payload.categoryName,
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
  
    } catch (err) {
      console.error(err);
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
  handleToAddCourses
};
