import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IEmailSummary extends Document {
  summaryType: "morning" | "evening" | "24hours";
  startDate: Date;
  endDate: Date;
  summaryText: string;
  emailCount: number;
  importantEmails: Array<{
    messageId: string;
    title: string;
    importance: number;
  }>;
  createdAt: Date;
}

const EmailSummarySchema: Schema = new Schema({
  summaryType: {
    type: String,
    required: true,
    enum: ["morning", "evening", "24hours"],
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  summaryText: { type: String, required: true },
  emailCount: { type: Number, required: true },
  importantEmails: [
    {
      messageId: String,
      title: String,
      importance: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IEmailSummary>(
  "EmailSummary",
  EmailSummarySchema
);
