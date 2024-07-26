import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IUser extends Document {
  telegramID: number;
  timezoneUTCDiff: number;
  chatsId: number[];
  createdAt: Date;

  blackListEmails?: string[];

  gmailAccounts: Array<{
    email: string;
    token: string;
    historyId: number;
  }>;

  isTrial: boolean;
  subscription?: {
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    paymentMethod: string;
    invoiceId: string;
  };
}

const UserSchema: Schema = new Schema({
  telegramID: { type: Number, required: true, unique: true },
  chatsId: { type: [Number], required: true, default: [] },
  timezoneUTCDiff: { type: Number, required: true, default: -7 },
  createdAt: { type: Date, default: Date.now },

  blackListEmails: { type: [String], required: false, default: null },

  gmailAccounts: [
    {
      email: { type: String, required: true, lowercase: true, trim: true },
      token: { type: String, required: true },
      historyId: { type: Number, required: true, default: 0 },
    },
  ],

  isTrial: { type: Boolean, required: true, default: true },

  subscription: {
    isActive: { type: Boolean, required: false, default: false },
    startDate: { type: Date, required: false, default: null },
    endDate: { type: Date, required: false, default: null },
    paymentMethod: { type: String, required: false, default: null },
    invoiceId: { type: String, required: false, default: null },
  },
});

export default mongoose.model<IUser>("User", UserSchema);
