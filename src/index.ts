import "dotenv/config";
import ServerApp from "@server/index";
import { error, info } from "@service/logging";
import mongoose from "mongoose";
import "@server/cron";

const { SERVER_PATH, PORT, DB_URL } = process.env;

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

const startServer = async () => {
  try {
    const app = await ServerApp();
    await app.listen({ port: +PORT, host: "0.0.0.0" });
    info(`Server running on port ${PORT}`);
  } catch (err) {
    error("Failed to start server:", err);
    throw err;
  }
};

const initializeApp = async () => {
  try {
    await connectToDatabase();
    info(`Connected to database at ${DB_URL}`);
    await startServer();
    info(`Server started at ${SERVER_PATH}`);
    info("Application initialized successfully");
  } catch (err) {
    error("Application initialization failed:", err);
    process.exit(1);
  }
};

initializeApp();
