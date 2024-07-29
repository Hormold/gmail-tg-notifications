import mongoose, { Schema, Document } from "mongoose";

// Define the interface for our document
interface ILinkShortener extends Document {
  key: string;
  url: string;
  ttl?: Date;
  createdAt: Date;
}

// Define the schema
const LinkShortnerSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  ttl: { type: Date, required: false },
  createdAt: { type: Date, default: Date.now },
});

// Create the model
export const LinkShortener = mongoose.model<ILinkShortener>(
  "LinkShortener",
  LinkShortnerSchema
);
