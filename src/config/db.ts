import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/med-track";
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
