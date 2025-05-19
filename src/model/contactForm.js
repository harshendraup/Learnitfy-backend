const mongoose = require("mongoose");
const contactFormSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  mobile: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  country: {
    type: String,

  },
  message: {
    type: String,
    require: true,
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
});

const Contact= new mongoose.model('contact',contactFormSchema);

module.exports={
    Contact
}
