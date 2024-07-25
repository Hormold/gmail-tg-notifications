import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IEmailSummary extends Document {
  summaryType: "morning" | "evening" | "24hours";
  startDate: Date;
  endDate: Date;
  summaryText: string;
  emailCount: number;
  categoryBreakdown: Record<string, number>;
  importantEmails: Array<{
    messageId: string;
    title: string;
    importance: number;
    telegramLink: string;
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
  categoryBreakdown: { type: Map, of: Number, required: true },
  importantEmails: [
    {
      messageId: String,
      title: String,
      importance: Number,
      telegramLink: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IEmailSummary>(
  "EmailSummary",
  EmailSummarySchema
);
