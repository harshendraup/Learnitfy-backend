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
    price: {
      type: String,
    },
    description: {
      type: String,
    },
    courseContent: [
      {
        moduleTitle: { type: String },
        description: { type: String },
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
      notes1:{
        type:String,
      },
      notes2:{
        type:String
      },
      notes3:{
        type:String
      },
      notes4:{
        type:String
      },
      notes:{
        type:String
      }
    },
  },
  {
    versionKey: false,
  }
);
const Course = new mongoose.model("courses", coursesSchema);

module.exports = Course;
