import mongoose from "mongoose";

const connectDB = async () => {
  try {

    if (!process.env.MONGODB_URI) {
      console.warn("⚠️  MONGODB_URI not set — skipping DB connection (development). Set MONGODB_URI in .env to enable MongoDB.");
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      // use default options; customize if needed
    });

    console.log("✅ MongoDB Connected Successfully");

  } catch (error) {

    console.error("❌ Database connection failed:", error);
    process.exit(1);

  }
};

export default connectDB;