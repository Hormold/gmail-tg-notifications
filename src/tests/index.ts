import "dotenv/config";
import mongoose from "mongoose";
import { error, info } from "@service/logging";
import { minify } from "./minify";
const { DB_URL } = process.env;

const MONGOOSE_OPTIONS = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
} as const;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(DB_URL, MONGOOSE_OPTIONS);
    info("Opened connection with db");
  } catch (err) {
    error("Failed to connect to database:", err);
    throw err; // Re-throw to stop app initialization
  }
};

connectToDatabase().then(() => {
  minify();
});
