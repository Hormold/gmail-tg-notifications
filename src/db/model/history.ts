import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

export interface IEmailHistory extends Document {
  email: string;
  messageId: string;
  processedAt?: Date;
  category?: string;
  importance?: number;
  processingDetails?: string;

  from?: string;
  title?: string;

  summary?: string;
  unsubscribeLink?: string;
  importantUrls?: { url: string; text?: string }[];
  deadline?: Date;
  actionSteps?: string[];

  telegramMessageButtons?: InlineKeyboardButton[][];
  telegramMessageId?: number;
  telegramMessageText?: string;
}

const HistorySchema: Schema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  messageId: { type: String, required: true },

  processedAt: { type: Date, required: false, default: Date.now },

  category: { type: String, required: false },
  from: { type: String, required: false },
  title: { type: String, required: false },
  summary: { type: String, required: false },

  importantUrls: { type: [{ url: String, text: String }], required: false },
  unsubscribeLink: { type: String, required: false },
  deadline: { type: Date, required: false },

  importance: { type: Number, required: false },
  actionSteps: { type: [String], required: false },
  processingDetails: { type: String, required: false },

  telegramMessageText: { type: String, required: false },
  telegramMessageId: { type: Number, required: false },
  telegramMessageButtons: {
    type: [],
    required: false,
  },
});

export default mongoose.model<IEmailHistory>("EmailHistory", HistorySchema);
