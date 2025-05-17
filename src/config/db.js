const mongoose = require("mongoose");

const connectToDb = async () => {
  try {
    const connectDb = await mongoose.connect(process.env.MONGODB_URL || "mongodb://localhost:27017/LearnItFy");
    console.log(`✅ MongoDB connected: ${connectDb.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = {
  connectToDb,
};
