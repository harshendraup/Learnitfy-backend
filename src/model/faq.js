const mongoose = require("mongoose");
const FAQSchema = new mongoose.Schema(
  {
    createdOn: {
      type: Date,
      require: true,
      default: new Date(),
    },
    updatedOn: {
      type: Date,
      default: new Date(),
    },
    status: {
      type: String,
      default: "Active",
      required: true,
    },
    courseName: {
      type: String,
    },
    courseId: {
      type: String,
    },
    faq: [
      {
        question: {
          type: String,
          trim: true,
        },
        answer: {
          type: String,
          trim: true,
        },
      },
    ],
    createdBy: String,
  },
  {
    versionKey: false,
  }
);

const FAQ = new mongoose.model("FAQ", FAQSchema);
module.exports = FAQ;
