const { Category } = require("../model/category");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { entityIdGenerator } = require("../utils/entityGenerator");
const Admin = require("../model/admin");
const Course = require("../model/courses");
const FAQ = require("../model/faq");

const handleToAddFaq = async (req, res) => {
    try {
      const payload = req.body;
  
      if (!payload || !payload.courseId || !Array.isArray(payload.faq)) {
        return res.status(400).json({ message: "Invalid payload fields." });
      }
  
      const faqCourse = await Course.findOne({ courseId: payload.courseId });
      if (!faqCourse) {
        return res.status(404).json({ message: "Course detail not found" });
      }
  
      const existingFaqDoc = await FAQ.findOne({ courseId: payload.courseId });
  
      if (existingFaqDoc) {
        existingFaqDoc.faq.push(...payload.faq);
        existingFaqDoc.updatedOn = new Date();
        await existingFaqDoc.save();
  
        return res.status(200).json({
          message: "FAQ(s) added to existing course",
          data: existingFaqDoc,
        });
      } else {
        const newFaq = new FAQ({
          courseId: faqCourse.courseId,
          courseName: faqCourse.courseName,
          status: "Active",
          createdOn: new Date(),
          updatedOn: new Date(),
          faq: payload.faq,
          createdBy: "Admin",
        });
  
        const savedFaq = await newFaq.save();
  
        return res.status(201).json({
          message: "New FAQ created successfully",
          data: savedFaq,
        });
      }
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Internal server error",
        error: err.message,
      });
    }
  };

  const handleToGetFaq = async(req,res)=>{
    try{
        const query= req.query;
        const matchQuery={};
        if(query.courseId){
            matchQuery['courseId']= query.courseId
        }
        const faqOfCourse = await FAQ.find(matchQuery).lean();
        if(faqOfCourse){
            return res.status(200).
            json({ message: "faq's of course are",
                faqOfCourse}
            );

        }
        else{
            return res.status(400).
            json({ message: "not found faq's of course" });
        }


    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
          message: "Internal server error",
          error: err.message,
        });
      }
  }

  const handleToDeleteFaq = async (req, res) => {
    try {
      const payload = req.body;
  
      if (!payload || !payload.courseId || !payload._id) {
        return res.status(400).json({ message: "Invalid payload fields." });
      }
  
      const courseFAQ = await FAQ.findOne({ courseId: payload.courseId });
      if (!courseFAQ) {
        return res.status(404).json({ message: "Course FAQ not found" });
      }
  
      const result = await FAQ.updateOne(
        { courseId: payload.courseId },
        { $pull: { faq: { _id: payload._id } }, $set: { updatedOn: new Date() } }
      );
  
      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "FAQ item not found or already removed" });
      }
  
      return res.status(200).json({ message: "FAQ deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Internal server error",
        error: err.message,
      });
    }
  };
   

module.exports={
    handleToAddFaq,
    handleToGetFaq,
    handleToDeleteFaq
}
