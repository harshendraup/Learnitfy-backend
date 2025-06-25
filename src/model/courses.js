const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const coursesSchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
    },
    courseName: {
      type: String,
    },
    courseId: {
      type: String,
    },
    categoryId: {
      type: String,
    },
    price: {
      type: String,
    },
    description: {
      type: String,
    },
    courseDetail: {
      heading: { type: String },
      aboutCourse: { type: String },
      subHeading: { type: String },
      point1: { type: String },
      point2: { type: String },
      point3: { type: String },
      point4: { type: String },
      point5: { type: String },
      point6: { type: String },
      point7: { type: String },
      point8: { type: String },
      point9: { type: String },
      point10: { type: String },
      point11: { type: String },
      point12: { type: String },
    },
    courseContent: [
      {
        moduleTitle: { type: String },
        point1: { type: String },
        point2: { type: String },
        point3: { type: String },
        point4: { type: String },
        point5: { type: String },
        point6: { type: String },
      },
    ],
    pdf: {
      type: String,
    },
    duration: {
      type: String,
    },
    image: {
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
    status: {
      type: String,
      default: "Inactive",
    },
    moreAboutCourse: {
      duration: {
        type: String,
      },
      noOfModules: {
        type: Number,
      },
      Activities: {
        type: Number,
      },
    },
    notes: {
      notes1: {
        type: String,
      },
      notes2: {
        type: String,
      },
      notes3: {
        type: String,
      },
      notes4: {
        type: String,
      },
    },
  },
  {
    versionKey: false,
  }
);
const Course = new mongoose.model("courses", coursesSchema);

module.exports = Course;
