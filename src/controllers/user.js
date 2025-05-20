const { Category } = require("../model/category");
const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { entityIdGenerator } = require("../utils/entityGenerator");
const Admin = require("../model/admin");
const Course = require("../model/courses");
const { Contact } = require("../model/contactForm");
const sendEmail = require("../utils/email");
const nodemailer = require("nodemailer");

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

      res.status(401).json({ message: "invalid payload fields" });
    }

    
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

module.exports = {
  handleToContact,
  getAllContacts,
  handleToSendBrochure,
};
