
const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    mobile:{
        type:Number
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
    role: {
      type: String,
      trim: true,
      required: true,
      enum: ["admin"],
    },
    adminId: {
      type: String,
    },
    status: {
      type: String,
      default: "Inactive",
    },
    profileImage: {
      type: String,
    },
    address: {
      state: {
        type: String,
      },
      district: {
        type: String,
      },
      subDistrict: {
        type: String,
      },
      addressline1: {
        type: String,
        trim: true,
      },
      street: {
        type: String,
      },
      pincode: {
        type: {
          type: Number,
          trim: true,
        },
      },
      region: {
        type: String,
      },
      houseNumber: String,
      isVerified: Boolean,
      addressType: String,
    },
  },
  {
    versionKey: false,
  }
);

const Admin = mongoose.model("admin", adminSchema);
module.exports =Admin
