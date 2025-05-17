const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        require:true,
        trim:true
    },
    description:{
        type:String,
        require:true,
        trim:true

    },
    logo:{
        type:String,
        require:true,
        trim:true

    },
    categoryId:{
        type:String
    }


})

const Category= new mongoose.model('category',categorySchema);
module.exports={
    Category
}