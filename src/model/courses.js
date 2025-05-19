const mongoose = require("mongoose");
const coursesSchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
    },
    courseName: {
      type: String,
    },
    courseId:{
      type:String
    },
    price: {
      type: String,
    },
    description: {
      type: String,
    },
    duration: {
      type: String,
    },
    image:{
      type:String
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
  },
  {
    versionKey: false,
  }
);
const Course= new mongoose.model('courses',coursesSchema)

module.exports=Course
