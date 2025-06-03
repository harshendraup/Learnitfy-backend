const mongoose = require("mongoose");

const enrollSchema = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    name: {
      type: String,
    },
    mobile: {
      type: Number,
    },
    courseName: {
      type: String,
    },
    categoryName: {
      type: String,
    },
    courseId: {
      type: String,
    },
    inquiryFor: {
      type: String,
    },
    createdOn: {
      type: Date,
      required: true,
      default: new Date(),
    },
    updateOn: {
      type: Date,
      default: new Date(),
    },
  },
  {
    versionKey: false,
  }
);

const Enroll =  mongoose.model('enroll',enrollSchema);

module.exports={
    Enroll
}