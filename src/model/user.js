const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email:{
        type:String
    },
    courseName:{
        type:String
    },
    categoryName:{
        type:String
    },
    courseId:{
        type:String
    },
    date: {
        type: Date,
        default: Date.now
      }
})

const User = mongoose.model('User', userSchema);
module.exports={
    User
}