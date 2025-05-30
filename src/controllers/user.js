require("dotenv").config();
const { Category } = require("../model/category");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { entityIdGenerator } = require("../utils/entityGenerator");
const Admin = require("../model/admin");
const Course = require("../model/courses");
const { Contact } = require("../model/contactForm");
const { sendEmailWithAttachment } = require("../utils/email");
const nodemailer = require("nodemailer");
const path = require("path");
const {User} = require('../model/user')

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

const handleToSendBrochure = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.email || !payload.courseId) {
      return res
        .status(400)
        .json({ message: "Email and courseId are required." });
    }
    const email = await User.find({email:payload.email});
    if(email.length>0){
      return res
      .status(400)
      .json({ message: "User has already taken a course" });
  
    }

    const courseDetail = await Course.findOne({ courseId: payload.courseId });

    if (!courseDetail || !courseDetail.pdf) {
      return res.status(404).json({ message: "Course or brochure not found." });
    }

    const pdfPath = path.join(__dirname, "../../coursePdf", courseDetail.pdf);

    const subject = `Course Brochure - ${courseDetail.courseName}`;
    const text = `Dear Student,

Thank you for your interest in the "${courseDetail.courseName}" course under "${courseDetail.categoryName}".

Please find attached the brochure with all the necessary details, including course content, duration, pricing, and more.

If you have any questions or would like to enroll, feel free to reply to this email.

Best regards,
Your Learning Team`;

    const emailSent = await sendEmailWithAttachment(
      payload.email,
      subject,
      text,
      pdfPath,
      `${courseDetail.courseName.replace(/\s+/g, "_")}_Brochure.pdf`
    );
    
    if (emailSent) {
      const newUser = new User({
        email:payload.email,
        categoryName: courseDetail.categoryName,
        courseName: courseDetail.courseName,
        courseId: courseDetail.courseId,
      });

      await newUser.save();

      return res
        .status(200)
        .json({ message: "Brochure sent successfully to the email." },
          newUser
        );
    } else {
      return res
        .status(500)
        .json({ message: "Failed to send email. Try again later." });
    }
  } catch (err) {
    console.error(err);
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

module.exports = {
  handleToContact,
  getAllContacts,
  handleToSendBrochure,
  getAllBrochureRequests
};
