const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      require: true,
      trim: true,
    },
    description: {
      type: String,
      require: true,
      trim: true,
    },
    logo: {
      type: String,
      require: true,
    },
    categoryId: {
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
    courseDetails: {
      courses: [{
        type: String
      }],
      courseId: [{
        type: String
      }]
    }
  },   
  {
    versionKey: false,
  }
);

const Category = new mongoose.model("category", categorySchema);
module.exports = {
  Category,
};
