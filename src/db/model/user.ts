import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IUser extends Document {
  telegramID: number;
  timezoneUTCDiff: number;
  chatsId: number[];

  blackListEmails?: string[];

  gmailAccounts: Array<{
    email: string;
    token: string;
    historyId: number;
  }>;
}

const UserSchema: Schema = new Schema({
  telegramID: { type: Number, required: true, unique: true },
  chatsId: { type: [Number], required: true, default: [] },
  timezoneUTCDiff: { type: Number, required: true, default: -7 },

  blackListEmails: { type: [String], required: false, default: null },

  gmailAccounts: [
    {
      email: { type: String, required: true, lowercase: true, trim: true },
      token: { type: String, required: true },
      historyId: { type: Number, required: true, default: 0 },
    },
  ],
});

export default mongoose.model<IUser>("User", UserSchema);
