require("dotenv").config();
const axios = require('axios');
const { Category } = require("../model/category");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { entityIdGenerator } = require("../utils/entityGenerator");
const {Enroll }= require("../model/enroll");
const Course = require("../model/courses");
const { Contact } = require("../model/contactForm");
const { sendEmailWithAttachment } = require("../utils/email");
const nodemailer = require("nodemailer");
const path = require("path");
const AWS = require("aws-sdk");
const {User} = require('../model/user')


const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const handleToContact = async (req, res) => {
  try {
    const payload = req.body;

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "mobile",
      "message",
    ];
    for (const field of requiredFields) {
      if (!payload[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    const contact = new Contact({
      ...payload,
      updatedOn: new Date(),
      status: "Active",
    });

    const contactDetails = await contact.save();

    return res.status(201).json({
      message: "Contact inquiry details submitted successfully",
      contactId: contactDetails._id,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ status: "Active" }).sort({
      updatedOn: -1,
    });
    const totalInquiryUsers = await Contact.countDocuments({
      status: "Active",
    });

    return res.status(200).json({
      message: "Contact inquiries fetched successfully",
      data: {
        contacts,
        totalInquiryUsers,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const deleteAllContacts = async (req, res) => {
  try {
    const result = await Contact.deleteMany({});
    return res.status(200).json({
      message: "All contact inquiries deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error deleting contact inquiries:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

const handleToSendBrochure = async (req, res) => {
  try {
    const { email, courseId } = req.body;

    if (!email || !courseId) {
      return res.status(400).json({ message: "Email and courseId are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User has already taken a course" });
    }

    const courseDetail = await Course.findOne({ courseId });
    if (!courseDetail || !courseDetail.pdf) {
      return res.status(404).json({ message: "Course or brochure not found." });
    }

    let pdfKey = courseDetail.pdf;
    if (pdfKey.startsWith("http")) {
      const urlObj = new URL(pdfKey);
      pdfKey = decodeURIComponent(urlObj.pathname.substring(1)); 
    }

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfKey,
    };

    const s3Object = await s3.getObject(s3Params).promise();

    const subject = `Course Brochure - ${courseDetail.courseName}`;
    const text = `Dear Student,

Thank you for your interest in the "${courseDetail.courseName}" course under "${courseDetail.categoryName}".

Please find attached the brochure with all the necessary details.

If you have any questions or would like to enroll, feel free to reply to this email.

Best regards,
Your Learning Team`;

    const emailSent = await sendEmailWithAttachment(
      email,
      subject,
      text,
      s3Object.Body,
      `${courseDetail.courseName.replace(/\s+/g, "_")}_Brochure.pdf`,
      "application/pdf"
    );

    if (emailSent) {
      const newUser = new User({
        email,
        categoryName: courseDetail.categoryName,
        courseName: courseDetail.courseName,
        courseId: courseDetail.courseId,
        date: new Date(),
      });

      await newUser.save();

      return res.status(200).json({
        message: "Brochure sent successfully to the email.",
        user: newUser,
      });
    } else {
      return res.status(500).json({ message: "Failed to send email. Try again later." });
    }
  } catch (err) {
    console.error("❌ Error sending brochure:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


const getAllBrochureRequests = async (req, res) => {
  try {


    const users = await User.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Brochure requests fetched successfully.",
      data: users,
    });
  } catch (err) {
    console.error("Error fetching brochure requests:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};



const handleToEnrollForCourse = async (req, res) => {
  try {
    const payload = req.body;

    if (
      !payload ||
      !payload.email ||
      !payload.name ||
      !payload.mobile ||
      !payload.courseId
    ) {
      return res.status(400).json({ message: "Invalid payload fields" });
    }

    const courseDetail = await Course.findOne({ courseId: payload.courseId });
    if (!courseDetail) {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrolledUser = await User.findOne({ email: payload.email });
    if (enrolledUser) {
      return res.status(409).json({ message: "User already enrolled" });
    }

    const newEnrollUser = new Enroll({
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      inquiryFor: courseDetail.courseName,
      courseName: courseDetail.courseName,
      createdOn: new Date(),
      updatedOn: new Date(),
    });

    const newUser = await newEnrollUser.save();

    return res.status(201).json({
      message: "User successfully enrolled",
      user: newUser,
    });
  } catch (err) {
    console.error("Error enrolling user for course:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

const handleToGetEnrolledUser = async (req, res) => {
  try {
    const payload = req.query;
    matchQuery = {};

    if (payload.email) {
      matchQuery["email"] = payload.email;
    }
    if (payload.courseName) {
      matchQuery["courseName"] = payload.courseName;
    }

    const enrolledObj = await Enroll.find(matchQuery).sort({ createdAt: -1 });
    if (!enrolledObj) {
      return res.status(200).json({ message: "not data found" });
    }
    const totalEnrollUser = await Enroll.countDocuments(matchQuery);

    res.status(200).json(
      { message: "Enrolled users:" ,
        enrollUser: enrolledObj,
        totalEnrollUser: totalEnrollUser},
      
    );
  } catch (err) {
    console.error("Error enrolling user for course:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

const deleteAllEnquiries = async (req, res) => {
  try {
    const result = await Enroll.deleteMany({});
    return res.status(200).json({
      message: "All contact inquiries deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Error deleting contact inquiries:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};



module.exports = {
  handleToContact,
  getAllContacts,
  handleToSendBrochure,
  getAllBrochureRequests,
  handleToGetEnrolledUser,
  handleToEnrollForCourse,
  deleteAllContacts,
  deleteAllEnquiries
};
