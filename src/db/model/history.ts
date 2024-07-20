import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IEmailHistory extends Document {
  email: string;
  messageId: string;
  processedAt?: Date;
  category?: string;
  //summary: string;
  importance?: number;
  //actionSteps: string[];
  processingDetails?: string;
}

const HistorySchema: Schema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  messageId: { type: String, required: true },

  processedAt: { type: Date, required: false, default: Date.now },

  category: { type: String, required: false },
  //summary: { type: String, required: true },
  importance: { type: Number, required: false },
  //actionSteps: { type: [String], required: true },
  processingDetails: { type: String, required: false },
});

export default mongoose.model<IEmailHistory>("EmailHistory", HistorySchema);
